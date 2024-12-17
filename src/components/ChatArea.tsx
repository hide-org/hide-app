import { useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Textarea } from './ui/textarea';
import { Send } from 'lucide-react';
import { ChatMessage } from './ChatMessage';

import { Message } from '../types';

interface ChatAreaProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const ChatArea = ({
  messages,
  input,
  isLoading,
  onSubmit,
  onInputChange,
  onKeyDown,
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      const behavior = messages.length <= 2 ? 'auto' : 'smooth';
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, [messages]);

  return (
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
          <CardFooter className="p-1 border-t">
            <form onSubmit={onSubmit} className="flex gap-2 items-center w-full">
              <div className="flex-1 min-h-[44px]">
                <Textarea
                  rows={1}
                  value={input}
                  onChange={onInputChange}
                  onKeyDown={onKeyDown}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 resize-none min-h-[44px] max-h-[200px]"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="gap-2"
              >
                <>
                  Send
                  <Send className="h-5 w-5" />
                </>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
