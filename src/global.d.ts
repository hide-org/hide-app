import { CoreMessage } from 'ai';
import { Project, Conversation } from './types';
import { UserSettings } from './types/settings';

declare global {
  interface Window {
    electron: {
      showDirectoryPicker: () => Promise<{ canceled: boolean; filePaths: string[] }>;
    };
    projects: {
      getAll: () => Promise<Project[]>;
      create: (project: Project) => Promise<Project[]>;
      update: (project: Project) => Promise<Project[]>;
      delete: (id: string) => Promise<Project[]>;
    };
    conversations: {
      getAll: (projectId: string) => Promise<Conversation[]>;
      create: (conversation: Conversation) => Promise<Conversation>;
      update: (conversation: Conversation) => Promise<Conversation>;
      delete: (id: string) => Promise<void>;
    };
    llm: {
      checkApiKey: () => Promise<boolean>;
    };
    settings: {
      get: () => Promise<UserSettings | null>;
      update: (settings: Omit<UserSettings, 'created_at' | 'updated_at'>) => Promise<UserSettings>;
    };
    chat: {
      start: (conversationId: string, systemPrompt?: string) => Promise<void>;
      stop: (conversationId: string) => Promise<void>;
      generateTitle: (conversationId: string, message: string) => Promise<void>;
      onMessage: (callback: (conversationId: string, message: CoreMessage) => void) => () => void;
      onUpdate: (callback: (conversation: Conversation) => void) => () => void;
    };
  }
}
