import { CoreMessage } from 'ai';
import { Project, Conversation } from './types';

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
    claude: {
      checkApiKey: () => Promise<boolean>;
      sendMessage: (messages: CoreMessage[], systemPrompt?: string) => {
        promise: Promise<CoreMessage[]>;
        onUpdate: (callback: (message: CoreMessage) => void) => () => void;
      };
      generateTitle: (message: string) => Promise<string>;
    };
  }
}
