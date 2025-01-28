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
  status: 'active' | 'inactive'
  createdAt: number;
  updatedAt: number;
}

export const newConversation = (projectId: string): Conversation => {
  const timestamp = Date.now();
  return {
    id: uuidv4(),
    title: DEFAULT_CONVERSATION_TITLE,
    messages: [],
    projectId: projectId,
    status: 'inactive',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  metadata: Record<string, any>;
  projectId: string;
  conversationId: string;
  createdAt: number;
  updatedAt: number;
}

export const newTask = (projectId: string, title: string, conversationId?: string, description?: string, metadata?: Record<string, any>) => {
  const timestamp = Date.now();
  return {
    id: uuidv4(),
    title,
    description: description || null,
    status: 'pending' as const,
    metadata: metadata || {},
    projectId,
    conversationId: conversationId || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  } as Task;
}
