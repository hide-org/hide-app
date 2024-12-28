import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { shellExec, escapeShellArg } from './shell';

export async function ensureUV(): Promise<string> {
    // Use app's userData directory and properly escape spaces
    const binDir = path.join(app.getPath('userData'), 'bin');
    fs.mkdirSync(binDir, { recursive: true });

    const uvPath = path.join(binDir, process.platform === 'win32' ? 'uv.exe' : 'uv');

    // If uv already exists and is executable, return its path
    if (fs.existsSync(uvPath)) {
        if (process.platform !== 'win32') {
            try {
                fs.accessSync(uvPath, fs.constants.X_OK);
                return uvPath;
            } catch (e) {
                // File exists but isn't executable, we'll reinstall it
            }
        } else {
            return uvPath;
        }
    }

    console.log('Installing uv...');

    try {
        // Download and run the install script
        const installCommand = `curl -LsSf https://astral.sh/uv/install.sh | env UV_UNMANAGED_INSTALL=${escapeShellArg(binDir)} sh`;
        const { stdout, stderr } = await shellExec(installCommand);

        console.log('uv installation output:', stdout);
        if (stderr) console.error('uv installation stderr:', stderr);

        // Verify installation
        if (!fs.existsSync(uvPath)) {
            throw new Error(`uv was not installed at expected path: ${uvPath}`);
        }

        if (process.platform !== 'win32') {
            fs.chmodSync(uvPath, '755');
        }

        // Verify uv is working
        const quotedUvPath = `"${uvPath}"`;
        const { stdout: uvInfo } = await shellExec(
            `${quotedUvPath} python -V`,
        );
        console.log('uv python info:', uvInfo);

        return uvPath;
    } catch (error) {
        console.error('Failed to install uv:', error);
        throw error;
    }
}
