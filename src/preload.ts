import { contextBridge, ipcRenderer } from 'electron';

import { Project, Conversation } from '@/types';
import { Message } from '@/types/message';
import { UserSettings } from '@/types/settings';

// Expose file dialog API
contextBridge.exposeInMainWorld('electron', {
    showDirectoryPicker: () => ipcRenderer.invoke('dialog:showDirectoryPicker'),
});

contextBridge.exposeInMainWorld('projects', {
    getAll: () => ipcRenderer.invoke('projects:getAll'),
    create: (project: Project) => ipcRenderer.invoke('projects:create', project),
    update: (project: Project) => ipcRenderer.invoke('projects:update', project),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id)
});

contextBridge.exposeInMainWorld('conversations', {
    getAll: (projectId: string) => ipcRenderer.invoke('conversations:getAll', projectId),
    create: (conversation: Conversation) => ipcRenderer.invoke('conversations:create', conversation),
    update: (conversation: Conversation) => ipcRenderer.invoke('conversations:update', conversation),
    delete: (id: string) => ipcRenderer.invoke('conversations:delete', { id })
});

// Expose settings API
contextBridge.exposeInMainWorld('settings', {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings: Omit<UserSettings, 'created_at' | 'updated_at'>) =>
        ipcRenderer.invoke('settings:update', settings)
});

// Expose chat API
contextBridge.exposeInMainWorld('chat', {
    start: (conversationId: string, systemPrompt?: string) =>
        ipcRenderer.invoke('chat:start', { conversationId, systemPrompt }),

    stop: (conversationId: string) =>
        ipcRenderer.invoke('chat:stop', { conversationId }),

    generateTitle: (conversationId: string, message: string) =>
        ipcRenderer.invoke('chat:generateTitle', { conversationId, message }),

    onMessage: (callback: (conversationId: string, message: Message) => void) => {
        const handler = (_event: any, { conversationId, message }: { conversationId: string, message: Message }) => {
            callback(conversationId, message)
        };
        ipcRenderer.on('chat:messageUpdate', handler);
        return () => {
            ipcRenderer.off('chat:messageUpdate', handler);
        };
    },

    onUpdate: (callback: (conversation: Conversation) => void) => {
        const handler = (_event: any, conversation: Conversation) => callback(conversation);
        ipcRenderer.on('chat:update', handler);
        return () => {
            ipcRenderer.off('chat:update', handler);
        };
    },

    reloadSettings: () => ipcRenderer.invoke('chat:reloadSettings'),
});
