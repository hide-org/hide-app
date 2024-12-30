import { MessageParam } from '@anthropic-ai/sdk/resources/messages';

// internal representation of a message for the UI
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool_use' | 'tool_result';
  content: string;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  // NOTE: using anthropic message type here; later we can create our own type to support different providers
  messages: MessageParam[];
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
}
