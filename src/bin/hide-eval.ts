#!/usr/bin/env node
import { runEvalCLI } from '../main/eval/cli.js';

runEvalCLI(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
