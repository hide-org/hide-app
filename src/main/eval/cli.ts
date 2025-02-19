import * as fs from 'fs';
import { program } from 'commander';
import { EvalService } from './service';
import { defaultEvalConfig } from './config';
import { readJsonl, readParquet, writeJsonl } from './utils';
import { SWEBenchInstance } from './types';
import * as path from 'path';
import { initializeDatabase } from '../db';

export async function runEvalCLI(args: string[]) {
  program
    .name('eval')
    .description('Evaluation tool for Hide')
    .requiredOption('-d, --dataset <path>', 'Path to dataset file (required, supports .jsonl and .parquet)')
    .option('-c, --config <path>', 'Path to config JSON file')
    .option('-o, --output <path>', 'Path to output JSONL file')
    .option('-b, --batch-size <number>', 'Batch size', '4')
    .option('-l, --limit <number>', 'Limit', '4')
    .option('-i, --instance-ids <string>', 'Comma-separated list of instance IDs to run')

  program.parse(args);

  const opts = program.opts();

  // Load dataset
  console.log('Loading dataset...');
  const ext = path.extname(opts.dataset).toLowerCase();
  let instances: SWEBenchInstance[];

  if (ext === '.jsonl') {
    instances = await readJsonl<SWEBenchInstance>(opts.dataset);
  } else if (ext === '.parquet') {
    instances = await readParquet<SWEBenchInstance>(opts.dataset);
  } else {
    throw new Error(`Unsupported file extension: ${ext}. Only .jsonl and .parquet files are supported.`);
  }

  console.log(`Loaded ${instances.length} instances`);

  // Load config
  const config = opts.config
    ? JSON.parse(await fs.promises.readFile(opts.config, 'utf-8'))
    : defaultEvalConfig;

  if (opts.batchSize) {
    config.batchSize = parseInt(opts.batchSize);
  }

  if (opts.instanceIds) {
    config.instanceIDs = opts.instanceIds.split(',');
  }

  // Initialize services
  console.log('Initializing services...');
  // TODO: avoid hardcoding path
  initializeDatabase("/Users/artemm/Library/Application Support/hide-app/database.sqlite");
  const evalService = new EvalService(config);

  // Run eval
  console.log(`Starting evaluation of ${Math.min(instances.length, config.limit)} instances...`);
  const results = await evalService.runEval(instances);

  // Save results
  const outputPath = opts.output || 'eval-results.jsonl';
  await writeJsonl(outputPath, results);
  console.log(`Evaluation complete. Results saved to ${outputPath}`);
}
