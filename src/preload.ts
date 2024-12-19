import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('mcp', {
    listTools: () => ipcRenderer.invoke('mcp:list-tools'),
    callTool: (name: string, parameters: any) => 
        ipcRenderer.invoke('mcp:call-tool', { name, parameters }),
});
