import { AssistantContentBlock, AssistantMessage, Message, newAssistantMessage, newUserMessage, UserContentBlock, UserMessage } from "@/types/message";
import { ImageBlockParam, MessageParam } from "@anthropic-ai/sdk/resources";

export function convertToAnthropic(message: Message): MessageParam {
    switch (message.role) {
        case 'user': {
            return convertUserMessageToAnthropic(message);
        }
        case 'assistant': {
            return convertAssistantMessageToAnthropic(message);
        }
    }
}

export function convertFromAnthropic(message: MessageParam): Message {
    switch (message.role) {
        case 'user': {
            return convertUserMessageFromAnthropic(message);
        }
        case 'assistant': {
            return convertAssistantMessageFromAnthropic(message);
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

                case 'tool_result': {
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
                                } as ImageBlockParam; // because mimeType is enum
                            }
                        }),
                    };
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
            }
        })
    };
}

function convertUserMessageFromAnthropic(message: MessageParam): UserMessage {
    if (typeof message.content === 'string') {
        return newUserMessage(message.content);
    }

    const content: UserContentBlock[] = message.content.map(block => {
        switch (block.type) {
            case 'text': {
                return block;
            }

            case 'image': {
                return {
                    type: 'image',
                    data: block.source.data,
                    mimeType: block.source.media_type,
                };
            }

            case 'tool_result': {
                if (typeof block.content === 'string') {
                    return {
                        type: 'tool_result',
                        toolUseId: block.tool_use_id,
                        isError: block.is_error,
                        content: [{ type: 'text', text: block.content }],
                    };
                }

                return {
                    type: 'tool_result',
                    toolUseId: block.tool_use_id,
                    isError: block.is_error,
                    content: block.content.map(c => {
                        if (c.type === 'text') {
                            return c;
                        }

                        if (c.type === 'image') {
                            return {
                                type: 'image',
                                data: c.source.data,
                                mimeType: c.source.media_type,
                            };
                        }
                    }),
                };
            }

            default: {
                console.warn('Unexpected block type for user message from Anthropic:', block.type);
            }
        }
    });
    return newUserMessage(content);
}

function convertAssistantMessageFromAnthropic(message: MessageParam): AssistantMessage {
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

            default: {
                console.warn('Unexpected block type for assistant message from Anthropic:', block.type);
            }
        }
    });

    return newAssistantMessage(content);
}
