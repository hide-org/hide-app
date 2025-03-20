import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources/messages';
import type { Tool as MCPTool } from '@modelcontextprotocol/sdk/types';
import type { ChatCompletionTool } from 'openai/resources';

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

export function mcpToOpenAIFunction(tool: MCPTool): ChatCompletionTool {
    const { name, description, inputSchema } = tool;
    return {
        type: 'function',
        function: {
            name,
            description,
            parameters: {
                type: inputSchema.type,
                properties: inputSchema.properties,
                required: inputSchema.required || [],
            },
        },
    };
}
