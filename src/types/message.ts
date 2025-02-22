import { v4 as uuidv4 } from 'uuid';


export type Message = UserMessage | AssistantMessage;

export type UserMessage = {
    id: string;
    role: 'user';
    content: string | UserContentBlock[];
};

export const newUserMessage = (content: string | UserContentBlock[]): UserMessage => {
    return {
        id: uuidv4(),
        role: 'user',
        content
    };
};

export type AssistantMessage = {
    id: string;
    role: 'assistant';
    content: string | AssistantContentBlock[];
};

export const newAssistantMessage = (content: string | AssistantContentBlock[]): AssistantMessage => {
    return {
        id: uuidv4(),
        role: 'assistant',
        content
    };
};

export type UserContentBlock = TextBlock | ImageBlock | ToolResultBlock;
export type AssistantContentBlock = TextBlock | ToolUseBlock;

export type ToolResultContentBlock = TextBlock | ImageBlock;

export type TextBlock = {
    type: 'text';
    text: string;
};

export type ImageBlock = {
    type: 'image';
    data: string;
    mimeType: string;
};

export type ToolUseBlock = {
    id: string;
    type: 'tool_use';
    name: string;
    args: Record<string, any>;
};

export type ToolResultBlock = {
    type: 'tool_result';
    toolUseId: string;
    isError: boolean;
    content: ToolResultContentBlock[];
};
