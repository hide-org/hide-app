import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Card } from './components/ui/card';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
}

const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `I am a simulated response to: "${input}"`,
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Chat History */}
      <div className="w-64 border-r bg-white p-4">
        <Card className="h-full">
          <h2 className="font-semibold mb-4">Chat History</h2>
          {/* Add chat history here */}
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          <Card className="h-full p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-left">
                <div className="inline-block p-2 rounded-lg bg-gray-200">
                  <span className="animate-pulse">Typing...</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-64 border-l bg-white p-4">
        <Card className="h-full">
          <h2 className="font-semibold mb-4">Details</h2>
          {/* Add details or context here */}
        </Card>
      </div>
    </div>
  );
};

const root = createRoot(document.body);
root.render(<App />);
