import { createRoot } from 'react-dom/client';
import { useState, useRef, useEffect } from 'react';
import { ChatArea } from './components/ChatArea';
import { ChatHistory } from './components/ChatHistory';
import { Details } from './components/Details';
import { v4 as uuidv4 } from 'uuid';

import { Message } from './types';

const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      const behavior = messages.length <= 2 ? 'auto' : 'smooth';
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
    };

    const placeholderMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
    };

    setMessages(prev => [...prev, userMessage, placeholderMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `I am a simulated response to: "${input}"\n\nHere's some example markdown:\n\n# Heading\n- List item 1\n- List item 2\n\n\`\`\`javascript\nconst code = "example";\nconsole.log(code);\n\`\`\``,
      };
      setMessages(prev => [...prev.slice(0, -1), aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  // Allow submitting with Enter and use Shift+Enter for new lines
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSubmit(e);
      }
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInput(textarea.value);
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatHistory />
      
      <ChatArea
        messages={messages}
        input={input}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      
      <Details />
    </div>
  );
};

const root = createRoot(document.body);
root.render(<App />);
