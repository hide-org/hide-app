import { createRoot } from 'react-dom/client';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter } from './components/ui/card';
import { Send } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

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
      {/* Left Sidebar - Chat History */}
      <div className="w-64 border-r p-4">
        <Card className="h-full">
          <CardContent>
            <h2 className="font-semibold mb-4">Chat History</h2>
            {/* Add chat history here */}
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          <Card className="h-full flex flex-col">
            <CardContent className="flex-1 overflow-y-auto pt-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  isLoading={isLoading && message === messages[messages.length - 1]}
                />
              ))}
              <div ref={messagesEndRef} />
            </CardContent>
            <CardFooter className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2 items-end w-full">
                <div className="flex-1 min-h-[44px]">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[44px] max-h-[200px]"
                    style={{ height: '44px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="h-11 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <>
                    Send
                    <Send className="h-5 w-5" />
                  </>
                </button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-64 border-l p-4">
        <Card className="h-full">
          <CardContent>
            <h2 className="font-semibold mb-4">Details</h2>
            {/* Add details or context here */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const root = createRoot(document.body);
root.render(<App />);
