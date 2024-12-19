import { MessageParam } from '@anthropic-ai/sdk/resources/messages';

// internal representation of a message
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  // NOTE: using anthropic message type here; later we can create our own type to support different providers
  messages: MessageParam[];
  createdAt: number;
  updatedAt: number;
}
