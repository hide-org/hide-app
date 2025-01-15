import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources/messages';
import type { Tool as MCPTool, CallToolResult as MCPToolResult } from '@modelcontextprotocol/sdk/types';
import { CoreTool, tool as aiTool, jsonSchema } from 'ai';

export function mcpToAnthropicTool(tool: MCPTool): AnthropicTool {
    const { name, description, inputSchema, ...rest } = tool;
    return {
        name,
        description,
        input_schema: {
            type: inputSchema.type,
            properties: inputSchema.properties,
            ...inputSchema
        },
        ...rest
    };
}

export function mcpToAiSdkTool(tool: MCPTool, callTool: (name: string, args: any) => Promise<MCPToolResult>): Record<string, CoreTool> {
    const { name, description, inputSchema } = tool;
    return {
        [name]: aiTool({
            description,
            parameters: jsonSchema(inputSchema),
            execute: async (args) => (callTool(name, args)),
            // map to anthropic's tool result format:
            experimental_toToolResultContent(result) {
                if (typeof result === 'string') {
                    return [{ type: 'text', text: result }];
                }

                if ('isError' in result && 'content' in result) {
                    const r = result as MCPToolResult;
                    return r.content.map(c => {
                        if (c.type === 'text') {
                            return { type: 'text', text: c.text };
                        }

                        if (c.type === 'image') {
                            return { type: 'image', data: c.data, mimeType: c.mimeType };
                        }

                        if (c.type === 'resource') {
                            console.error('Embedded resources are not supported');
                        }
                    });
                }

                console.error('Unexpected tool result:', result);
                return [];
            },
        })
    }
}
