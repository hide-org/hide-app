import {
  CoreMessage,
  CoreSystemMessage,
  CoreUserMessage,
  CoreAssistantMessage,
  CoreToolMessage,
} from 'ai';
import { Message } from '../types';
import { simpleHash } from './utils';

function convertSystemMessage(message: CoreSystemMessage): Message[] {
  return [{
    id: simpleHash(message.content).toString(),
    role: message.role,
    content: message.content,
  }];
}

function convertUserMessage(message: CoreUserMessage): Message[] {
  if (typeof message.content === 'string') {
    return [{
      id: simpleHash(message.content).toString(),
      role: message.role,
      content: message.content,
    }];
  }

  return message.content.map(part => {
    if (part.type === 'text') {
      return {
        id: simpleHash(part.text).toString(),
        role: message.role,
        content: part.text,
      };
    }

    // Handle image and file attachments
    const content = `Attachments (${part.type}) are not supported yet`;
    return {
      id: simpleHash(content).toString(),
      role: message.role,
      content: content,
    };
  });
}

function convertAssistantMessage(message: CoreAssistantMessage): Message[] {
  if (typeof message.content === 'string') {
    return [{
      id: simpleHash(message.content).toString(),
      role: message.role,
      content: message.content,
    }];
  }

  return message.content.map(part => {
    if (part.type === 'text') {
      return {
        id: simpleHash(part.text).toString(),
        role: message.role,
        content: part.text,
      };
    }

    if (part.type === 'tool-call') {
      const content = `Tool: \`${part.toolName}\`\n\nInput:\n\`\`\`json\n${JSON.stringify(part.args, null, 2)}\n\`\`\``;
      return {
        id: simpleHash(content).toString(),
        role: 'tool_use',
        content: content,
      };
    }
  });
}

function convertToolMessage(message: CoreToolMessage): Message[] {
  return message.content.map(part => {
    const content = `Tool Result:\n\`\`\`text\n${part.result as string}\n\`\`\``;
    return {
      id: simpleHash(content).toString(),
      role: 'tool_result',
      content: content,
      isError: part.isError,
    };
  });
}

export function convertClaudeMessages(messages: CoreMessage[]): Message[] {
  return messages.flatMap(message => {
    switch (message.role) {
      case 'system':
        return convertSystemMessage(message);
      case 'user':
        return convertUserMessage(message);
      case 'assistant':
        return convertAssistantMessage(message);
      case 'tool':
        return convertToolMessage(message);
      default:
        throw new Error(`Unexpected message role: ${(message as any).role}`);
    }
  });
}
