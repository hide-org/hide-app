import { Project, Conversation } from '@/types';
import { Message } from '@/types/message';
import { UserSettings } from '@/types/settings';

declare global {
  interface Window {
    electron: {
      showDirectoryPicker: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      onCredentialsRequired: (callback: (error: string) => void) => () => void;
      on: (channel: string, callback: (data: any) => void) => void;
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
    settings: {
      get: () => Promise<UserSettings | null>;
      update: (settings: Omit<UserSettings, 'created_at' | 'updated_at'>) => Promise<UserSettings>;
    };
    chat: {
      start: (conversationId: string, systemPrompt?: string) => Promise<void>;
      stop: (conversationId: string) => Promise<void>;
      generateTitle: (conversationId: string, message: string) => Promise<void>;
      onMessage: (callback: (conversationId: string, message: Message) => void) => () => void;
      onUpdate: (callback: (conversation: Conversation) => void) => () => void;
      reloadSettings: () => Promise<void>;
    };
  }
}
