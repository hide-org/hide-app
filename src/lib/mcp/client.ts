import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types';

export async function listTools(): Promise<Tool[]> {
    const response = await window.mcp.listTools();
    return response.tools;
}

export async function callTool(name: string, parameters: any): Promise<CallToolResult> {
    return await window.mcp.callTool(name, parameters);
}
