import { ipcMain } from 'electron';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types";

// 5-minute timeout
const DEFAULT_TIMEOUT = 300_000;
let mcpClient: Client | null = null;

export async function initializeMCP(command: string, args: string[] = []) {
    const transport = new StdioClientTransport({
        command,
        args,
    });

    mcpClient = new Client({
        name: "hide-app",
        version: "1.0.0",
    }, {
        capabilities: {}
    });

    await mcpClient.connect(transport);
}

// IPC handlers
ipcMain.handle('mcp:list-tools', async () => {
    if (!mcpClient) throw new Error('MCP client not initialized');
    return await mcpClient.listTools(undefined, { timeout: DEFAULT_TIMEOUT });
});

ipcMain.handle('mcp:call-tool', async (_, args: { name: string; parameters: any; }) => {
    if (!mcpClient) throw new Error('MCP client not initialized');
    return await mcpClient.callTool({ name: args.name, arguments: args.parameters }, CallToolResultSchema, { timeout: DEFAULT_TIMEOUT });
});
