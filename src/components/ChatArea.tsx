import { useRef, useEffect, useState } from 'react';
import { Conversation, DEFAULT_CONVERSATION_TITLE, newConversation, Project } from '../types';
import { Bot } from 'lucide-react';
import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from './ChatMessage';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from "@/components/ui/sidebar"
import { H2 } from '@/components/ui/typography';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { useMessageConversion } from '@/hooks/useMessageConversion';
import { systemPrompt } from '@/lib/prompts';
import { CoreMessage } from 'ai';


interface ChatAreaProps {
  conversation: Conversation | null;
  onNewConversation: (conversation: Conversation) => void;
  onAddMessage: (conversationId: string, message: CoreMessage) => void;
  onUpdateTitle: (conversationId: string, title: string) => void;
  project: Project | null;
  error: string | null;
  onError: (error: string | null) => void;
}

export const ChatArea = ({
  conversation,
  onNewConversation,
  onAddMessage,
  onUpdateTitle,
  project,
  error,
  onError,
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      const behavior = conversation?.messages.length <= 2 ? 'auto' : 'smooth';
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, [conversation?.messages]);

  const [isLoading, setIsLoading] = useState(false);

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

  const onSendMessage = (async (input: string) => {

    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    let c = conversation;
    let shouldGenerateTitle = false;

    const message: CoreMessage = {
      role: 'user',
      content: input.trim(),
    };

    let messages: CoreMessage[];

    if (!conversation) {
      // Create new conversation with the first message
      c = newConversation(project?.id);
      messages = [message];
      c.messages = messages;
      onNewConversation(c);
      shouldGenerateTitle = true;
    } else {
      if (c.title === DEFAULT_CONVERSATION_TITLE) {
        shouldGenerateTitle = true;
      }
      // For existing conversations, add message and build complete array
      onAddMessage(c.id, message);
      messages = [...c.messages, message];
    }

    try {
      const { promise, onUpdate } = window.claude.sendMessage(messages, systemPrompt(project));

      // Set up update handler for streaming responses and get cleanup function
      const cleanup = onUpdate((message) => {
        onAddMessage(c.id, message);
      });

      try {
        // Wait for all messages
        await promise;
      } finally {
        // Always clean up the handler to prevent memory leaks and duplicates
        cleanup();
      }

      if (shouldGenerateTitle) {
        try {

          const title = await window.claude.generateTitle(messages[0]?.content as string || input.trim());
          onUpdateTitle(c.id, title);
        } catch (error) {
          console.error('Error generating title:', error);
        }
      }

      onError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error sending message:', err);
      onError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  })

  return (
    <div className="flex-1 flex flex-col">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
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
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-gray-900 mr-2" />
                    <span className="text-gray-500">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-0" />
            </div>
          </ScrollArea>
          <ChatInput onSendMessage={onSendMessage} disabled={isLoading} className="py-4 max-w-3xl mt-auto" />
        </>
      ) : (
        <div className="flex h-full flex-col justify-center">
          <H2 className="w-full max-w-2xl mx-auto border-0">
            {title()}
          </H2>
          <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
        </div>
      )}
    </div>
  );
};
