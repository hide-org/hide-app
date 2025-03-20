import { AssistantContentBlock, AssistantMessage, Message, newAssistantMessage, ToolResultMessage, UserMessage } from "@/types/message";
import { ImageBlockParam, MessageParam } from "@anthropic-ai/sdk/resources";

export function convertToAnthropic(message: Message): MessageParam {
    switch (message.role) {
        case 'user': {
            return convertUserMessageToAnthropic(message);
        }
        case 'assistant': {
            return convertAssistantMessageToAnthropic(message);
        }
        case 'tool': {
            return convertToolMessageToAnthropic(message);
        }
    }
}

function convertUserMessageToAnthropic(message: UserMessage): MessageParam {
    if (typeof message.content === 'string') {
        return {
            role: 'user',
            content: message.content,
        };
    }

    return {
        role: 'user',
        content: message.content.map(block => {
            switch (block.type) {
                case 'text': {
                    return block;
                }

                case 'image': {
                    return {
                        type: 'image',
                        source: {
                            type: 'base64',
                            data: block.data,
                            media_type: block.mimeType,
                        },
                    } as ImageBlockParam; // because mimeType is enum
                }
            }
        })
    };
}

function convertAssistantMessageToAnthropic(message: AssistantMessage): MessageParam {
    if (typeof message.content === 'string') {
        return {
            role: 'assistant',
            content: message.content,
        };
    }

    return {
        role: 'assistant',
        content: message.content.map(block => {
            switch (block.type) {
                case 'text': {
                    return block;
                }

                case 'tool_use': {
                    return {
                        type: 'tool_use',
                        id: block.id,
                        name: block.name,
                        input: block.args,
                    };
                }

                case 'thinking': {
                    return {
                        type: 'thinking',
                        signature: block.signature,
                        thinking: block.text,
                    };
                }

                case 'redacted_thinking': {
                    return {
                        type: 'redacted_thinking',
                        data: block.data,
                    };
                }
            }
        })
    };
}

function convertToolMessageToAnthropic(message: ToolResultMessage): MessageParam {
    return {
        role: 'user',
        content: message.content.map(block => {
            return {
                type: 'tool_result',
                tool_use_id: block.toolUseId,
                is_error: block.isError,
                content: block.content.map(c => {
                    if (c.type === 'text') {
                        return c;
                    }

                    if (c.type === 'image') {
                        return {
                            type: 'image',
                            source: {
                                type: 'base64',
                                data: c.data,
                                media_type: c.mimeType,
                            },
                        } as ImageBlockParam; // because media_type is enum
                    }
                }),
            }
        })
    };
}

export function convertAssistantMessageFromAnthropic(message: MessageParam): AssistantMessage {
    if (typeof message.content === 'string') {
        return newAssistantMessage(message.content);
    }

    const content: AssistantContentBlock[] = message.content.map(block => {
        switch (block.type) {
            case 'text': {
                return block;
            }

            case 'tool_use': {
                return {
                    type: 'tool_use',
                    id: block.id,
                    name: block.name,
                    args: block.input,
                };
            }

            case 'thinking': {
                return {
                    type: 'thinking',
                    signature: block.signature,
                    text: block.thinking,
                };
            }

            case 'redacted_thinking': {
                return {
                    type: 'redacted_thinking',
                    data: block.data,
                };
            }

            default: {
                console.warn('Unexpected block type for assistant message from Anthropic:', block.type);
            }
        }
    });

    return newAssistantMessage(content);
}
