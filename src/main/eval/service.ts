import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChatService } from '../services/chat';
import { createProject, getProjectByName, createConversation } from '../db';
import { Project } from '../../types';
import { EvalConfig, SWEBenchInstance, EvalResult } from './types';
import { bash } from './utils';
import { newUserMessage } from '../../types/message';
import { AnthropicService } from '../services/anthropic';
import { MCPServer } from '../mcp';

export class EvalService {
  // private chatService: ChatService;
  private config: EvalConfig;
  private results: Map<string, EvalResult>;

  constructor(config: EvalConfig) {
    // this.chatService = chatService;
    this.config = config;
    this.results = new Map();
  }

  async runEval(instances: SWEBenchInstance[]): Promise<EvalResult[]> {
    // Create eval project if doesn't exist
    const project = await this.ensureEvalProject();

    // Clean up work dir
    await bash(`rm -rf ${this.config.workDir}`);

    const numInstances = this.config.instanceIDs ? this.config.instanceIDs.length : Math.min(instances.length, this.config.limit);

    // Process instances in batches
    for (let i = 0; i < numInstances; i += this.config.batchSize) {
      const batch = this.config.instanceIDs ? this.config.instanceIDs.map(id => instances.find(instance => instance.instance_id === id)) : instances.slice(i, i + this.config.batchSize);
      console.log(`Processing batch ${i / this.config.batchSize + 1}/${Math.ceil(numInstances / this.config.batchSize)}`);
      await Promise.all(batch.map(instance => this.processInstance(instance, project)));
    }

    return Array.from(this.results.values());
  }

  private async ensureEvalProject(): Promise<Project> {
    let project = getProjectByName(this.config.projectName);
    if (!project) {
      project = {
        id: uuidv4(),
        name: this.config.projectName,
        path: this.config.workDir,
        description: 'Project for evaluation runs'
      };
      createProject(project);
    }
    return project;
  }

  private async processInstance(instance: SWEBenchInstance, project: Project): Promise<void> {
    console.log(`Processing instance ${instance.instance_id}...`);
    const workDir = '/testbed';
    const containerName = uuidv4();
    try {
      // Setup dev environment
      // const containerId = await this.setupDevEnv(instance);

      // Install uv
      // const output = await this.execInContainer(containerId, 'sh -c "curl -LsSf https://astral.sh/uv/install.sh | env UV_UNMANAGED_INSTALL=/usr/local/bin sh"')
      // console.log(`Installed uv with output:`, output);

      // Copy mcp to container
      // const mcpDest = '/hide-mcp/';
      // await this.copyPath(containerId, '/Users/artemm/Code/hide-mcp/', mcpDest);

      // Start MCP server
      const mcp = await this.startMCPServer('docker', ['run', '-i', '--rm', '--name', containerName, 'astropy-13398']);
      const tools = await mcp.listTools();
      console.log(`MCP server started with ${tools.length} tools`);

      // Initialize chat service
      const chatService = await this.initializeChatService(mcp);

      // Prepare prompt
      const prompt = this.preparePrompt(instance, workDir);

      // Create conversation
      const conversation = {
        id: uuidv4(),
        title: `Eval: ${instance.instance_id}`,
        messages: [newUserMessage(prompt)],
        projectId: project.id,
        status: 'inactive' as const,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      createConversation(conversation);

      // Start chat and wait for completion
      await chatService.startChat(conversation.id);

      // Generate patch
      const patch = await this.generatePatch(workDir, containerName);

      // Save result
      this.results.set(instance.instance_id, {
        instance_id: instance.instance_id,
        model_patch: patch,
        model_name_or_path: this.config.modelName
      });

      console.log(`Successfully processed instance ${instance.instance_id}`);
    } catch (error) {
      console.error(`Failed to process instance ${instance.instance_id}:`, error);
      // Store empty patch for failed instances
      this.results.set(instance.instance_id, {
        instance_id: instance.instance_id,
        model_patch: '',
        model_name_or_path: this.config.modelName
      });
    } finally {
      // Clean up work dir
      await bash(`docker rm -f ${containerName}`);
    }
  }

  private async setupDevEnv(instance: SWEBenchInstance): Promise<string> {
    // Build image; hardcoded for now
    const imageName = 'astropy-13398';

    // Start container
    const { stdout, stderr } = await bash(`docker run -d ${imageName} tail -f /dev/null`)
    if (stderr) {
      throw new Error(`Failed to start container: ${stderr}`);
    }

    // Not reliable but good enough for now
    const containerId = stdout.trim();
    console.log(`Container for image ${imageName} started with ID ${containerId}`);

    return containerId;
  }

  private async copyPath(containerId: string, src: string, dst: string): Promise<void> {
    await bash(`docker cp ${src} ${containerId}:${dst}`);
  }

  private async execInContainer(container: string, cmd: string, workDir?: string): Promise<string> {
    const command = workDir ? `docker exec -w ${workDir} ${container} sh -c '${cmd}'` : `docker exec ${container} sh -c '${cmd}'`;
    const { stdout } = await bash(command);
    return stdout;
  }

  private async startMCPServer(command: string, args: string[]): Promise<MCPServer> {
    return MCPServer.create(command, args);
  }

  private async initializeChatService(mcp: MCPServer): Promise<ChatService> {
    const anthropicService = new AnthropicService(mcp);
    anthropicService.loadSettings();
    const chatService = new ChatService(anthropicService);
    return chatService;
  }

  private preparePrompt(instance: SWEBenchInstance, workDir: string): string {
    return this.config.promptTemplate
      .replace(/{location}/g, workDir)
      .replace('{pr_description}', instance.problem_statement)
  }

  private async generatePatch(workDir: string, container: string): Promise<string> {
    return this.execInContainer(container, 'git add -A && git diff --cached', workDir);
  }
}
