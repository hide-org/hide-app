import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChatService } from '../services/chat';
import { createProject, getProjectByName, createConversation } from '../db';
import { Project } from '../../types';
import { EvalConfig, SWEBenchInstance, EvalResult } from './types';
import { bash } from './utils';
import { newUserMessage } from '../../types/message';

export class EvalService {
  private chatService: ChatService;
  private config: EvalConfig;
  private results: Map<string, EvalResult>;

  constructor(chatService: ChatService, config: EvalConfig) {
    this.chatService = chatService;
    this.config = config;
    this.results = new Map();
  }

  async runEval(instances: SWEBenchInstance[]): Promise<EvalResult[]> {
    // Create eval project if doesn't exist
    const project = await this.ensureEvalProject();

    // Process instances in batches
    for (let i = 0; i < instances.length; i += this.config.batchSize) {
      const batch = instances.slice(i, i + this.config.batchSize);
      console.log(`Processing batch ${i / this.config.batchSize + 1}/${Math.ceil(instances.length / this.config.batchSize)}`);
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
    try {
      // Setup dev environment
      const workDir = path.join(this.config.workDir, instance.instance_id);
      await this.setupDevEnv(instance, workDir);

      // Prepare prompt
      const prompt = this.preparePrompt(instance);

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
      await this.chatService.startChat(conversation.id);

      // Generate patch
      const patch = await this.generatePatch(workDir);

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
    }
  }

  private async setupDevEnv(instance: SWEBenchInstance, workDir: string): Promise<void> {
    // Create directory if it doesn't exist
    await bash(`mkdir -p ${workDir}`);

    // Clone repo
    await bash(`git clone ${instance.repo} ${workDir}`);

    // Checkout base commit
    await bash(`cd ${workDir} && git checkout ${instance.base_commit}`);
  }

  private preparePrompt(instance: SWEBenchInstance): string {
    return this.config.promptTemplate
      .replace('{{problem_statement}}', instance.problem_statement)
      .replace('{{hints_text}}', instance.hints_text);
  }

  private async generatePatch(workDir: string): Promise<string> {
    const { stdout } = await bash('git diff', { cwd: workDir });
    return stdout;
  }
}
