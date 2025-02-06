import * as fs from 'fs';
import { program } from 'commander';
import { AnthropicService } from '../services/anthropic';
import { ChatService } from '../services/chat';
import { EvalService } from './service';
import { defaultEvalConfig } from './config';
import { readJsonl, writeJsonl } from './utils';
import { SWEBenchInstance } from './types';
import { initializeMCP, listTools } from '../mcp';

export async function runEvalCLI(args: string[]) {
  program
    .name('eval')
    .description('Evaluation tool for Hide')
    .requiredOption('-d, --dataset <path>', 'Path to dataset JSONL file (required)')
    .option('-c, --config <path>', 'Path to config JSON file')
    .option('-o, --output <path>', 'Path to output JSONL file')
    .option('-b, --batch-size <number>', 'Batch size', '4')

  program.parse(args);

  const opts = program.opts();

  // Load dataset
  console.log('Loading dataset...');
  const instances = await readJsonl<SWEBenchInstance>(opts.dataset);
  console.log(`Loaded ${instances.length} instances`);

  // Load config
  const config = opts.config
    ? JSON.parse(await fs.promises.readFile(opts.config, 'utf-8'))
    : defaultEvalConfig;

  if (opts.batchSize) {
    config.batchSize = parseInt(opts.batchSize);
  }

  // Initialize services
  console.log('Initializing services...');
  await initializeMCP('uv', ['--directory', '/Users/artemm/Code/hide-mcp', 'run', 'hide-mcp', 'server'])
  const tools = await listTools();
  const anthropicService = new AnthropicService(tools);
  const chatService = new ChatService(anthropicService);
  const evalService = new EvalService(chatService, config);

  // Run eval
  console.log(`Starting evaluation of ${instances.length} instances...`);
  const results = await evalService.runEval(instances);

  // Save results
  const outputPath = opts.output || 'eval-results.jsonl';
  await writeJsonl(outputPath, results);
  console.log(`Evaluation complete. Results saved to ${outputPath}`);
}

// Export everything needed for both CLI and programmatic usage
export { EvalService } from './service';
export { defaultEvalConfig } from './config';
export * from './types';
