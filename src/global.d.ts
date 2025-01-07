import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types';
import { Project, Conversation } from './types';

declare global {
  interface Window {
    mcp: {
      listTools: () => Promise<{ tools: Tool[] }>;
      callTool: (name: string, parameters: any) => Promise<CallToolResult>;
    };
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
  }
}
