import { useRef, useEffect } from 'react';
import { Message } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Textarea } from './ui/textarea';
import { Send, Bot } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';

interface ChatAreaProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  projectName: string;
  conversationTitle: string;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const ChatArea = ({
  messages,
  input,
  isLoading,
  projectName,
  conversationTitle,
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
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 px-4 pt-6 pb-0">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {projectName}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{conversationTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4">
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-180px)]" type="hover">
              <div className="px-4 py-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                  />
                ))}
                {isLoading && (
                  <div className="flex items-start space-x-4 p-4">
                    <Avatar className="w-8 h-8 border">
                      <AvatarImage src="/bot-avatar.png" alt="AI" />
                      <AvatarFallback>
                        <Bot className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-gray-900 mr-2" />
                      <span className="text-gray-500">Thinking...</span>
                    </div>
                  </div>
                )}
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
