import { createRoot } from 'react-dom/client';

import { Chat } from './components/Chat';
import { ThemeProvider } from './components/ThemeProvider';
import { TitleBar } from './components/TitleBar';

const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <TitleBar />
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
