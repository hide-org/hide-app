import { useRef, useEffect, useState } from 'react';
import { Conversation, Project } from '@/types';
import { Bot } from 'lucide-react';
import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/components/ChatMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from "@/components/ui/sidebar"
import { H2 } from '@/components/ui/typography';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useMessageConversion } from '@/hooks/useMessageConversion';


interface ChatAreaProps {
  conversation: Conversation | null;
  onNewConversation: (message: string) => Promise<void>;
  onNewMessage: (conversationId: string, message: string) => Promise<void>;
  onStop: () => Promise<void>;
  isLoading: boolean;
  project: Project | null;
  error: string | null;
}

export const ChatArea = ({
  conversation,
  onNewConversation,
  onNewMessage,
  onStop,
  isLoading,
  project,
  error,
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isStopping, setIsStopping] = useState(false);

  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      const behavior = conversation?.messages.length <= 2 ? 'auto' : 'smooth';
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, [conversation?.messages]);

  // Reset isStopping when loading state changes
  useEffect(() => {
    setIsStopping(false);
  }, [isLoading]);

  const title = () => {
    const hour = new Date().getHours();
    let greeting;

    if (hour >= 5 && hour < 12) {
      greeting = 'Good morning';
    } else if (hour >= 12 && hour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }

    if (project?.name) {
      return `${greeting}, how may I assist you with ${project.name}?`;
    }

    return `${greeting}, how may I assist you?`;
  }

  const currentMessages = useMessageConversion(conversation?.messages);

  const handleStop = async () => {
    setIsStopping(true);
    await onStop();
  };

  const handleMessage = (async (input: string) => {
    if (!input.trim()) return;

    if (!conversation) {
      await onNewConversation(input);
      return;
    }

    await onNewMessage(conversation.id, input);
  })

  return (
    <div className="flex-1 flex flex-col pt-6">
      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 px-4 pt-6 pb-0">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {project?.name}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{conversation?.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Messages Area */}
      {conversation?.messages.length > 0 ? (
        <>
          <ScrollArea className="mt-4" type="hover">
            <div className="w-full max-w-3xl mx-auto">
              {currentMessages.map((message) => (
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
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted border-t-foreground mr-2" />
                    <span className="text-muted-foreground">{isStopping ? "Stopping..." : "Thinking..."}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-0" />
            </div>
          </ScrollArea>
          <ChatInput
            onSendMessage={handleMessage}
            onStop={handleStop}
            disabled={isLoading}
            isLoading={isLoading}
            isStopping={isStopping}
            className="py-4 max-w-3xl mt-auto"
          />
        </>
      ) : (
        <div className="flex h-full flex-col justify-center">
          <H2 className="w-full max-w-2xl mx-auto border-0 mb-6">
            {title()}
          </H2>
          <ChatInput
            onSendMessage={handleMessage}
            onStop={handleStop}
            disabled={isLoading}
            isLoading={isLoading}
            isStopping={isStopping}
            className="max-w-2xl mx-auto w-full px-4"
          />
        </div>
      )}
    </div>
  );
};
