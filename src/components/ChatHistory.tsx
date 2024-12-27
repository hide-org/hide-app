import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChatPreview } from './ChatPreview';
import { Conversation } from '../types';
import { ScrollArea } from './ui/scroll-area';

interface ChatHistoryProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (c: Conversation) => void;
  onNewChat: () => void;
}

export const ChatHistory = ({
  conversations = [],
  selectedConversation,
  onSelectConversation,
  onNewChat,
}: ChatHistoryProps) => {
  return (
    <div className="w-80 border-r p-4">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl">Chat History</CardTitle>
          <Button
            onClick={onNewChat}
            className="w-full"
            variant="outline"
          >
            New Chat
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-200px)]" type="hover">
            <div className="px-4 space-y-2">
              {conversations.map((conversation) => (
                <ChatPreview
                  key={conversation.id}
                  id={conversation.id}
                  title={conversation.title}
                  isSelected={selectedConversation?.id === conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  updatedAt={conversation.updatedAt}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
