export interface ElectronAPI {
  showDirectoryPicker: () => Promise<{ canceled: boolean; filePaths: string[] }>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
