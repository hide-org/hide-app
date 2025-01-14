import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema, JSONRPCMessage, CallToolResult, Tool } from "@modelcontextprotocol/sdk/types";
import { shellExec, escapeShellArg } from './shell';

// 5-minute timeout
const DEFAULT_TIMEOUT = 300_000;
let mcpClient: Client | null = null;

export async function initializeMCP(command: string, args: string[] = []) {
    mcpReadyPromise = (async () => {
        try {
            console.log('Creating MCP StdioClientTransport...', { command, args });
            console.log(`Checking ${command} installation...`);
            try {
                const { stdout: usage } = await shellExec(`${escapeShellArg(command)} --help`);
                console.log(`${command} usage:`, usage.trim());
            } catch (err) {
                console.error(`Error checking ${command}:`, err);
                throw new Error(`${command} check failed: ${err.message}`);
            }

            // Create transport with stdout/stderr capture
            const transport = new StdioClientTransport({
                command,
                args,
                env: {
                    ...process.env,  // Preserve user's environment
                    PYTHONUNBUFFERED: '1',  // Ensure Python output isn't buffered
                    // TODO: this is probably not necessary
                    PATH: process.env.PATH,  // Ensure PATH is preserved
                    HIDE_MCP_LOG_LEVEL: 'DEBUG',
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
                // TODO: should this be filled in?
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

// Direct MCP functions for main process use
export async function listTools(): Promise<Tool[]> {
    // Wait for MCP to be ready
    if (mcpReadyPromise) {
        await mcpReadyPromise;
    }

    if (!mcpClient) throw new Error('MCP client not initialized');
    const toolsResult = await mcpClient.listTools(undefined, { timeout: DEFAULT_TIMEOUT });
    return toolsResult.tools;
}

export async function callTool(name: string, parameters: any): Promise<CallToolResult> {
    // Wait for MCP to be ready
    if (mcpReadyPromise) {
        await mcpReadyPromise;
    }

    if (!mcpClient) throw new Error('MCP client not initialized');
    return await mcpClient.callTool({ name, arguments: parameters }, CallToolResultSchema, { timeout: DEFAULT_TIMEOUT });
}


