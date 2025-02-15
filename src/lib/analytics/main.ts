import { BrowserWindow } from 'electron';

export const captureEvent = (eventName: string, properties: Record<string, any> = {}) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_ANALYTICS_TEST === 'true') {
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('analytics:event', { 
        name: eventName, 
        properties 
      });
    });
  }
} 