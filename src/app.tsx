import { createRoot } from 'react-dom/client';
import { Chat } from './components/Chat';

const App = () => {
  return (
      <Chat />
  );
};

const root = createRoot(document.body);
root.render(<App />);
