import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';

import { Chat } from './components/Chat';
import { ThemeProvider } from './components/ThemeProvider';
import { initAnalytics, captureEvent } from '@/lib/analytics/renderer';

const App = () => {
  useEffect(() => {
    // Initialize analytics
    initAnalytics();

    // Listen for analytics events from main process
    window.electron.on('analytics:event', (event: { name: string, properties: any }) => {
      captureEvent(event.name, event.properties);
    });

    // Track app launch
    captureEvent('app_launched');
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <Chat />
    </ThemeProvider>
  );
};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element not found');
  }
  const root = createRoot(container);
  root.render(<App />);
});
