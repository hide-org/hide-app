import {
  CoreMessage,
  CoreSystemMessage,
  CoreUserMessage,
  CoreAssistantMessage,
  CoreToolMessage,
} from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../types';

function convertSystemMessage(message: CoreSystemMessage): Message[] {
  return [{
    id: uuidv4(),
    role: message.role,
    content: message.content,
  }];
}

function convertUserMessage(message: CoreUserMessage): Message[] {
  if (typeof message.content === 'string') {
    return [{
      id: uuidv4(),
      role: message.role,
      content: message.content,
    }];
  }

  return message.content.map(part => {
    if (part.type === 'text') {
      return {
        id: uuidv4(),
        role: message.role,
        content: part.text,
      };
    }

    // Handle image and file attachments
    return {
      id: uuidv4(),
      role: message.role,
      content: `Attachments (${part.type}) are not supported yet`,
    };
  });
}

function convertAssistantMessage(message: CoreAssistantMessage): Message[] {
  if (typeof message.content === 'string') {
    return [{
      id: uuidv4(),
      role: message.role,
      content: message.content,
    }];
  }

  return message.content.map(part => {
    if (part.type === 'text') {
      return {
        id: uuidv4(),
        role: message.role,
        content: part.text,
      };
    }

    if (part.type === 'tool-call') {
      return {
        id: uuidv4(),
        role: 'tool_use',
        content: `Tool: \`${part.toolName}\`\n\nInput:\n\`\`\`json\n${JSON.stringify(part.args, null, 2)}\n\`\`\``,
      };
    }
  });
}

function convertToolMessage(message: CoreToolMessage): Message[] {
  return message.content.map(part => {
    return {
      id: uuidv4(),
      role: 'tool_result',
      content: `Tool Result:\n\`\`\`text\n${part.result as string}\n\`\`\``,
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
