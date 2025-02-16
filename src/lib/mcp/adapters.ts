import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources/messages';
import type { Tool as MCPTool, CallToolResult as MCPToolResult } from '@modelcontextprotocol/sdk/types';

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
