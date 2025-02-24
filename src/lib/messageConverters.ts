import { AssistantMessage, Message, ToolUseBlock, UserMessage } from '@/types/message';
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

  return message.content.flatMap((part, partIdx): UIMessage[] => {
    switch (part.type) {
      case 'text':
        return [{
          id: message.id,
          role: message.role,
          content: part.text,
        }];
      case 'image':
        return [{
          id: message.id,
          role: message.role,
          content: 'Image Attachments are not supported yet',
        }];
      case 'tool_result':
        return part.content.map((block, blockIdx) => {
          switch (block.type) {
            case 'text':
              const content = block.text;
              return {
                id: `${message.id}-${partIdx}-${blockIdx}`,
                role: 'tool_result',
                content: content,
                isError: part.isError,
              }
            case 'image':
              return {
                id: `${message.id}-${partIdx}-${blockIdx}`,
                role: 'tool_result',
                content: 'Image Attachments are not supported yet',
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
        return messageFromToolUse(block);
    }
  });
}
/**
  * This function converts a ToolUseBlock to a UIMessage. It is very tightly and implicitly
  * coupled with the tools that are currently supported, and will need to be updated if new
  * tools are added. It will also break if the tools are renamed or their arguments are changed.
  * To fix this, we need to rewrite the whole tools infrastructure which we can't afford to do right now.
  * So we are deliberately taking a technical debt on this hoping that we can pay it back later.
  */
function messageFromToolUse(block: ToolUseBlock): UIMessage {
  switch (block.name) {
    case 'str_replace_editor':
      return messageFromTextEditor(block);
    case 'bash':
      return messageFromShell(block);
    default:
      return {
        id: block.id,
        role: 'tool_use',
        content: `Tool: ${block.name}\n\nInput:\n\n${JSON.stringify(block.args, null, 2)}\n`,
      };
  }
}

function messageFromTextEditor(block: ToolUseBlock): UIMessage {
  const { command, ...args } = block.args;
  switch (command) {
    case 'view':
      return {
        id: block.id,
        role: 'tool_use',
        content: `Viewing file: ${args.path}`,
      };
    case 'create':
      return {
        id: block.id,
        role: 'tool_use',
        content: `Creating file: ${args.path}`,
      };
    case 'str_replace':
      return {
        id: block.id,
        role: 'tool_use',
        content: `Updating file: ${args.path}`,
      };
    case 'insert':
      return {
        id: block.id,
        role: 'tool_use',
        content: `Updating file: ${args.path}`,
      };
    case 'undo_edit':
      return {
        id: block.id,
        role: 'tool_use',
        content: `Undoing edits to file: ${args.path}`,
      };
    default:
      return {
        id: block.id,
        role: 'tool_use',
        content: `Tool: ${block.name}\n\nInput:\n\n${JSON.stringify(block.args, null, 2)}\n`,
      };
  }
}

function messageFromShell(block: ToolUseBlock): UIMessage {
  const { command } = block.args;
  return {
    id: block.id,
    role: 'tool_use',
    content: `Running shell command: ${command}`,
  };
}
