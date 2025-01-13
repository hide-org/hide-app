import { contextBridge, ipcRenderer } from 'electron';

import { Project, Conversation } from '@/types';

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

// Expose Claude API
contextBridge.exposeInMainWorld('claude', {
    checkApiKey: () => ipcRenderer.invoke('claude:checkApiKey'),
    sendMessage: (messages: any[], systemPrompt?: string) => {
        const promise = ipcRenderer.invoke('claude:sendMessage', { messages, systemPrompt });
        const onUpdate = (callback: (message: any) => void) => {
            ipcRenderer.on('claude:messageUpdate', (_event, message) => callback(message));
        };
        return { promise, onUpdate };
    },
    generateTitle: (message: string) => ipcRenderer.invoke('claude:generateTitle', message)
});
