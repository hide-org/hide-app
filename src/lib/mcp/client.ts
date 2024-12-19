import type { Tool } from './types';

declare global {
    interface Window {
        mcp: {
            listTools: () => Promise<{ tools: Tool[] }>;
            callTool: (name: string, parameters: any) => Promise<any>;
        };
    }
}

export async function listTools(): Promise<Tool[]> {
    const response = await window.mcp.listTools();
    return response.tools;
}

export async function callTool(name: string, parameters: any): Promise<any> {
    return await window.mcp.callTool(name, parameters);
}
