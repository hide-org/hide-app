import { useRef, useEffect } from 'react';
import { Message } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Textarea } from './ui/textarea';
import { Send } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ScrollArea } from './ui/scroll-area';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      <div className="flex-1 p-4">
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-140px)]" type="hover">
              <div className="px-4 py-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    isLoading={isLoading && message === messages[messages.length - 1]}
                  />
                ))}
                <div ref={messagesEndRef} className="h-0" />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="px-1 py-2 border-t">
            <form onSubmit={onSubmit} className="w-full">
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="relative flex flex-col h-full">
                    <Textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      onChange={onInputChange}
                      onKeyDown={onKeyDown}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className="p-3 resize-none min-h-[44px] max-h-[300px] overflow-y-hidden"
                    />
                  </div>
                </div>
                <div className="flex items-end py-1.5 pr-1.5">
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
                </div>
              </div>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
