import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources/messages';
import type { Tool as MCPTool } from './types';

export function mcpToAnthropicTool(mcpTool: MCPTool): AnthropicTool {
    return {
        name: mcpTool.name,
        description: mcpTool.description,
        input_schema: mcpTool.inputSchema
    };
}
