import { CoreMessage } from 'ai';
import { contextBridge, ipcRenderer } from 'electron';

import { Project, Conversation } from '@/types';
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

// Expose LLM API
contextBridge.exposeInMainWorld('llm', {
    checkApiKey: () => ipcRenderer.invoke('llm:checkApiKey'),
    sendMessage: (messages: CoreMessage[], systemPrompt?: string) => {
        const promise = ipcRenderer.invoke('llm:sendMessage', { messages, systemPrompt });
        const onUpdate = (callback: (message: CoreMessage) => void) => {
            // Create the handler function that we can reference later for removal
            const handler = (_event: any, message: CoreMessage) => callback(message);
            ipcRenderer.on('llm:messageUpdate', handler);
            // Return a cleanup function
            return () => {
                ipcRenderer.removeListener('llm:messageUpdate', handler);
            };
        };
        return { promise, onUpdate };
    },
    generateTitle: (message: string) => ipcRenderer.invoke('llm:generateTitle', message)
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

    onMessage: (callback: (conversationId: string, message: CoreMessage) => void) => {
        const handler = (_event: any, { conversationId, message }: { conversationId: string, message: CoreMessage }) => {
            console.log(`Calling renderer callback for message (${conversationId})`)
            console.dir(message)
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
    }
});
