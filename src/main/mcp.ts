import { ipcMain } from 'electron';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema, JSONRPCMessage } from "@modelcontextprotocol/sdk/types";
import { shellExec, escapeShellArg, getUserShell } from './shell';

// 5-minute timeout
const DEFAULT_TIMEOUT = 300_000;
let mcpClient: Client | null = null;

export async function initializeMCP(command: string, args: string[] = []) {
    mcpReadyPromise = (async () => {
        try {
            console.log('Creating StdioClientTransport...', { command, args });
            // First verify that uv is working
            console.log('Checking uv installation...');
            try {
                const { stdout: uvVersion } = await shellExec(`${escapeShellArg(command)} --version`);
                console.log('uv version:', uvVersion.trim());
            } catch (err) {
                console.error('Error checking uv:', err);
                throw new Error(`uv check failed: ${err.message}`);
            }

            // Get the user's shell for process execution
            const shell = await getUserShell();
            console.log('Using shell:', shell);

            // Create transport with stdout/stderr capture
            const transport = new StdioClientTransport({
                command,
                args,
                env: {
                    ...process.env,  // Preserve user's environment
                    PYTHONUNBUFFERED: '1',  // Ensure Python output isn't buffered
                    PATH: process.env.PATH  // Ensure PATH is preserved
                }
            });

            // Add logging for process events
            transport.onmessage = (message: JSONRPCMessage) => console.log('MCP transport message:', message);
            transport.onerror = (error: Error) => console.error('MCP transport error:', error);
            transport.onclose = () => {
                console.log('MCP transport closed');
                mcpClient = null;
                mcpReadyPromise = null;
            };

            console.log('Creating MCP client...');
            mcpClient = new Client({
                name: "hide-app",
                version: "1.0.0",
            }, {
                capabilities: {}
            });

            console.log('Connecting to MCP...');
            // Add a timeout to the connection attempt
            const connectPromise = mcpClient.connect(transport);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('MCP connection timeout after 10s')), 10000);
            });

            await Promise.race([connectPromise, timeoutPromise]);
            console.log('Connected to MCP successfully');

            // Test the connection
            console.log('Testing connection with listTools...');
            const tools = await mcpClient.listTools();
            console.log('MCP tools list received:', tools);
        } catch (error) {
            console.error('Detailed MCP initialization error:', error);
            if (error.cause) console.error('Error cause:', error.cause);
            if (error.stack) console.error('Error stack:', error.stack);
            mcpClient = null;
            mcpReadyPromise = null;
            throw new Error(`MCP initialization failed: ${error.message}`);
        }
    })();

    // Return the readiness promise so the caller can wait for it
    return mcpReadyPromise;
}

// Track MCP readiness
let mcpReadyPromise: Promise<void> | null = null;

// IPC handlers
ipcMain.handle('mcp:list-tools', async () => {
    try {
        // Wait for MCP to be ready
        if (mcpReadyPromise) {
            await mcpReadyPromise;
        }

        if (!mcpClient) throw new Error('MCP client not initialized');
        return await mcpClient.listTools(undefined, { timeout: DEFAULT_TIMEOUT });
    } catch (error) {
        console.error('Error in mcp:list-tools:', {
            error: error.toString(),
            stack: error.stack,
            details: error
        });
        throw error;
    }
});

ipcMain.handle('mcp:call-tool', async (_, args: { name: string; parameters: any; }) => {
    try {
        // Wait for MCP to be ready
        if (mcpReadyPromise) {
            await mcpReadyPromise;
        }

        if (!mcpClient) throw new Error('MCP client not initialized');
        return await mcpClient.callTool({ name: args.name, arguments: args.parameters }, CallToolResultSchema, { timeout: DEFAULT_TIMEOUT });
    } catch (error) {
        console.error('Error in mcp:call-tool:', {
            error: error.toString(),
            stack: error.stack,
            details: error,
            args
        });
        throw error;
    }
});
