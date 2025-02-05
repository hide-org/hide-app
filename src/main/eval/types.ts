export interface SWEBenchInstance {
  instance_id: string;
  patch: string;
  repo: string;
  base_commit: string;
  hints_text: string;
  created_at: string;
  test_patch: string;
  problem_statement: string;
  version: string;
  environment_setup_commit: string;
  FAIL_TO_PASS: string[];
  PASS_TO_PASS: string[];
}

export interface EvalResult {
  instance_id: string;
  model_patch: string;
  model_name_or_path: string;
}

export interface EvalConfig {
  projectName: string;       // Project name for evaluation runs
  batchSize: number;        // How many instances to run concurrently
  workDir: string;         // Where to clone repositories
  modelName: string;      // Model identifier 
  promptTemplate: string; // Template for constructing prompts
}