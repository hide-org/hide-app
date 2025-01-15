import { CoreMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_CONVERSATION_TITLE = 'Untitled Chat';
//
// internal representation of a message for the UI
export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool' | 'tool_use' | 'tool_result';
  content: string;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  // NOTE: using vercel ai message type here; later we can create our own type to support different providers
  messages: CoreMessage[];
  projectId: string;
  createdAt: number;
  updatedAt: number;
}

export const newConversation = (projectId: string) => {
  const timestamp = Date.now();
  return {
    id: uuidv4(),
    title: DEFAULT_CONVERSATION_TITLE,
    messages: [],
    projectId: projectId,
    createdAt: timestamp,
    updatedAt: timestamp,
  } as Conversation;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
}
