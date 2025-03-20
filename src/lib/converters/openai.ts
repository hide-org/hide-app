import { Message, TextBlock, ToolUseBlock, UserMessage, AssistantMessage, ToolResultMessage, newAssistantMessage } from '@/types/message';
import { ChatCompletionMessageParam, ChatCompletionContentPartText, ChatCompletionMessageToolCall, ChatCompletionAssistantMessageParam } from 'openai/resources/chat';

/**
 * Converts our internal message format to OpenAI's format
 */
export function convertToOpenAI(message: Message): ChatCompletionMessageParam[] {
  switch (message.role) {
    case 'user': {
      return [convertUserMessageToOpenAI(message)];
    }
    case 'assistant': {
      return [convertAssistantMessageToOpenAI(message)];
    }
    case 'tool': {
      return convertToolMessageToOpenAI(message);
    }
  }
}

/**
 * Converts a user message to OpenAI format
 */
function convertUserMessageToOpenAI(message: UserMessage): ChatCompletionMessageParam {
  // Simple case: text-only message
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
        case 'text':
          return {
            type: 'text',
            text: block.text
          }
        case 'image':
          return {
            type: 'image_url',
            image_url: {
              url: block.data,
            },
          }
      }
    })
  }
}

/**
 * Converts an assistant message to OpenAI format
 */
function convertAssistantMessageToOpenAI(message: AssistantMessage): ChatCompletionMessageParam {
  // Simple case: text-only message
  if (typeof message.content === 'string') {
    return {
      role: 'assistant',
      content: message.content,
    };
  }

  const content: ChatCompletionContentPartText[] = message.content
    .filter(block => block.type === 'text')
    .map((block: TextBlock) => {
      return {
        type: 'text',
        text: block.text
      }
    });

  const toolCalls: ChatCompletionMessageToolCall[] = message.content
    .filter(block => block.type === 'tool_use')
    .map((block: ToolUseBlock) => {
      return {
        type: 'function',
        id: block.id,
        function: {
          name: block.name,
          arguments: JSON.stringify(block.args)
        }
      }
    });

  return {
    role: 'assistant',
    content: content,
    tool_calls: toolCalls,
  }
}

function convertToolMessageToOpenAI(message: ToolResultMessage): ChatCompletionMessageParam[] {
  return message.content.map(block => {
    return {
      role: 'tool',
      tool_call_id: block.toolUseId,
      content: block.content.map(c => {
        if (c.type === 'text') {
          return {
            type: 'text',
            text: c.text
          };
        }

        if (c.type === 'image') {
          return {
            type: 'text',
            text: 'Image Attachments are not supported for tools yet',
          };
        }
      }),
    };
  });
}

/**
 * Converts OpenAI's message format to our internal format
 */
export function convertAssistantMessageFromOpenAI(message: ChatCompletionAssistantMessageParam): Message {
  const content: TextBlock[] = [];

  if (message.content) {
    if (typeof message.content === 'string') {
      content.push({
        type: 'text',
        text: message.content,
      });
    }

    if (Array.isArray(message.content)) {
      const textBlocks: TextBlock[] = message.content
        // Filter out refusal blocks
        .filter((block): block is ChatCompletionContentPartText => block.type === 'text')
        .map(block => ({ type: 'text', text: block.text }))

      content.push(...textBlocks);
    }
  }

  const toolCalls: ToolUseBlock[] = message.tool_calls?.map(call => {
    return {
      id: call.id,
      type: 'tool_use',
      name: call.function.name,
      args: JSON.parse(call.function.arguments || '{}'),
    };
  }) ?? [];

  return newAssistantMessage([...content, ...toolCalls]);
}
