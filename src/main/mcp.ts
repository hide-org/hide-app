import { ipcMain } from 'electron';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

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
    return await mcpClient.listTools();
});

ipcMain.handle('mcp:call-tool', async (_, args: { name: string; parameters: any; }) => {
    if (!mcpClient) throw new Error('MCP client not initialized');
    return await mcpClient.callTool({ name: args.name, arguments: args.parameters });
});
