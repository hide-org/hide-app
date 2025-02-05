import * as fs from 'fs';
import * as readline from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function readJsonl<T>(filePath: string): Promise<T[]> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const results: T[] = [];
  for await (const line of rl) {
    if (line.trim()) {
      results.push(JSON.parse(line));
    }
  }

  return results;
}

export async function writeJsonl(filePath: string, data: any[]): Promise<void> {
  const stream = fs.createWriteStream(filePath);
  for (const item of data) {
    stream.write(JSON.stringify(item) + '\n');
  }
  await new Promise(resolve => stream.end(resolve));
}

export async function bash(command: string, options?: { cwd?: string }): Promise<{stdout: string, stderr: string}> {
  try {
    const result = await execAsync(command, options);
    return result;
  } catch (error: any) {
    // Include the error details in the thrown error
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}