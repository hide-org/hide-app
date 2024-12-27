import { createRoot } from 'react-dom/client';
import { Chat } from './components/Chat';

const App = () => {
  return (
    <>
      <div className="titlebar-region" />
      <Chat />
    </>
  );
};

const root = createRoot(document.body);
root.render(<App />);
