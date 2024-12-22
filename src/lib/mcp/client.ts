import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types';

declare global {
    interface Window {
        mcp: {
            listTools: () => Promise<{ tools: Tool[] }>;
            callTool: (name: string, parameters: any) => Promise<CallToolResult>;
        };
    }
}

export async function listTools(): Promise<Tool[]> {
    const response = await window.mcp.listTools();
    return response.tools;
}

export async function callTool(name: string, parameters: any): Promise<CallToolResult> {
    return await window.mcp.callTool(name, parameters);
}
