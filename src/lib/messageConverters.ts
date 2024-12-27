import { MessageParam } from '@anthropic-ai/sdk/src/resources/messages';
import { Message } from '../types';
import { simpleHash } from './utils';

export function convertClaudeMessages(messages: MessageParam[]): Message[] {
  return messages.flatMap(message => {
    if (typeof message.content === 'string') {
      return [{
        id: simpleHash(message.content).toString(),
        role: message.role,
        content: message.content,
      }];
    }

    if (Array.isArray(message.content)) {
      return message.content.map(block => {
        if (block.type === 'text') {
          return {
            id: simpleHash(block.text).toString(),
            role: message.role,
            content: block.text,
          };
        }

        if (block.type === 'image') {
          return {
            id: simpleHash(block.source.data).toString(),
            role: message.role,
            content: 'Images are not supported yet',
          }
        }

        if (block.type === 'tool_use') {
          const content = `Tool: \`${block.name}\`\n\nInput:\n\`\`\`json\n${JSON.stringify(block.input, null, 2)}\n\`\`\``;
          return {
            id: simpleHash(content).toString(),
            role: 'tool_use',
            content: content,
          };
        }

        if (block.type === 'tool_result') {
          if (typeof block.content === 'string') {
            const content = `Tool Result:\n\`\`\`text\n${block.content as string}\n\`\`\``;
            return {
              id: simpleHash(content).toString(),
              role: 'tool_result',
              content: content,
              isError: block.is_error,
            };
          }

          if (Array.isArray(block.content)) {
            const contents = block.content.map(block => {
              if (block.type === 'text') {
                return block.text;
              }

              if (block.type === 'image') {
                return "Images are not supported yet";
              }
            })

            const content = `Tool Result:\n\`\`\`text\n${contents.join('\n')}\n\`\`\``;
            return {
              id: simpleHash(content).toString(),
              role: 'tool_result',
              content: content,
              isError: block.is_error,
            };
          }
        }
      });
    }

    throw new Error('Unexpected message type');
  });
}
