import { contextBridge, ipcRenderer } from 'electron';

import { Project } from '@/types';

contextBridge.exposeInMainWorld('mcp', {
    listTools: () => ipcRenderer.invoke('mcp:list-tools'),
    callTool: (name: string, parameters: any) =>
        ipcRenderer.invoke('mcp:call-tool', { name, parameters }),
});

// Expose file dialog API
contextBridge.exposeInMainWorld('electron', {
    showDirectoryPicker: () => ipcRenderer.invoke('dialog:showDirectoryPicker'),
});

contextBridge.exposeInMainWorld('projects', {
    getAll: () => ipcRenderer.invoke('projects:getAll'),
    create: (project: Project) => ipcRenderer.invoke('projects:create', project),
    update: (project: Project) => ipcRenderer.invoke('projects:update', project),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id)
}
)
