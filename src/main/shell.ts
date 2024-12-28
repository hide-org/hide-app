import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getUserShell(): Promise<string> {
    try {
        if (process.platform === 'win32') {
            return process.env.COMSPEC || 'cmd.exe';
        }

        // Try to get the user's login shell
        const { stdout } = await execAsync('dscl . -read ~ UserShell');
        const shell = stdout.trim().replace('UserShell: ', '');
        if (shell) return shell;

        // Fallback to $SHELL environment variable
        if (process.env.SHELL) return process.env.SHELL;

        // Final fallbacks
        if (process.platform === 'darwin') return '/bin/zsh';
        return '/bin/bash';
    } catch (err) {
        // If all else fails, return a reasonable default
        if (process.platform === 'darwin') return '/bin/zsh';
        if (process.platform === 'win32') return process.env.COMSPEC || 'cmd.exe';
        return '/bin/bash';
    }
}

export function escapeShellArg(arg: string): string {
    if (process.platform === 'win32') {
        // Windows: wrap in quotes and escape inner quotes with additional quotes
        return `"${arg.replace(/"/g, '""')}"`;
    } else {
        // Unix: wrap in single quotes and escape inner single quotes
        return `'${arg.replace(/'/g, "'\\''")}'`;
    }
}

export interface ShellExecOptions {
    env?: NodeJS.ProcessEnv;
    cwd?: string;
    timeout?: number;
}

export async function shellExec(command: string, options: ShellExecOptions = {}): Promise<{ stdout: string; stderr: string }> {
    const shell = await getUserShell();
    const shellFlag = process.platform === 'win32' ? '/c' : '-c';

    return execAsync(command, {
        ...options,
        shell,
        env: {
            ...process.env,  // Preserve current env
            ...options.env,  // Allow overrides
            PATH: process.env.PATH  // Ensure PATH is preserved
        }
    });
}