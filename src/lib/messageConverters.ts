import { AssistantMessage, Message, UserMessage } from '@/types/message';
import { UIMessage } from '@/types';


export function convertClaudeMessages(messages: Message[]): UIMessage[] {
  return messages.flatMap(message => {
    switch (message.role) {
      case 'user':
        return convertUserMessage(message);
      case 'assistant':
        return convertAssistantMessage(message);
    }
  });
}

function convertUserMessage(message: UserMessage): UIMessage[] {
  if (typeof message.content === 'string') {
    return [{
      id: message.id,
      role: message.role,
      content: message.content,
    }];
  }

  return message.content.flatMap((part, partIdx) => {
    switch (part.type) {
      case 'text':
        return {
          id: message.id,
          role: message.role,
          content: part.text,
        };
      case 'image':
        return {
          id: message.id,
          role: message.role,
          content: 'Image Attachments are not supported yet',
        };
      case 'tool_result':
        return part.content.map((block, blockIdx) => {
          switch (block.type) {
            case 'text':
              const content = `Tool Result:\n\`\`\`text\n${block.text}\n\`\`\``;
              return {
                id: `${message.id}-${partIdx}-${blockIdx}`,
                role: message.role,
                content: content,
                isError: part.isError,
              }
            case 'image':
              return {
                id: `${message.id}-${partIdx}-${blockIdx}`,
                role: message.role,
                content: 'Tool Result: Image Attachments are not supported yet',
                isError: part.isError,
              };
          }
        })
    }
  });
}

function convertAssistantMessage(message: AssistantMessage): UIMessage[] {
  if (typeof message.content === 'string') {
    return [{
      id: message.id,
      role: message.role,
      content: message.content,
    }];
  }

  return message.content.map((block, idx) => {
    switch (block.type) {
      case 'text':
        return {
          id: `${message.id}-${idx}`,
          role: message.role,
          content: block.text,
        };
      case 'tool_use':
        const content = `Tool: \`${block.name}\`\n\nInput:\n\`\`\`json\n${JSON.stringify(block.args, null, 2)}\n\`\`\``;
        return {
          id: `${message.id}-${idx}`,
          role: message.role,
          content: content,
        };
    }
  });
}
