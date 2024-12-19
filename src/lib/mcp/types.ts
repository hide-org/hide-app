export interface Tool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
        }>;
        required?: string[];
    };
}

export interface ToolCall {
    name: string;
    parameters: Record<string, any>;
}

export interface ParsedMessage {
    text: string;
    toolCalls: ToolCall[];
}
