import * as path from 'path';
import * as os from 'os';
import { EvalConfig } from './types';

export const defaultEvalConfig: EvalConfig = {
  projectName: 'eval',
  batchSize: 4,
  workDir: path.join(os.tmpdir(), 'hide-eval'),
  modelName: 'claude-2',
  promptTemplate: `Here's a programming task. The problem is:
{{problem_statement}}

Additional hints and context:
{{hints_text}}

Please help me fix this issue by providing a solution.
Keep in mind that your solution will be used to create a git patch.`
};