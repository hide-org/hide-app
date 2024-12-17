import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChatPreview } from './ChatPreview';
import { Conversation } from '../types';

interface ChatHistoryProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string | null) => void;
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
        <CardContent className="space-y-2">
          {conversations.map((conversation) => (
            <ChatPreview
              key={conversation.id}
              id={conversation.id}
              title={conversation.title}
              isSelected={selectedConversation === conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              updatedAt={conversation.updatedAt}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
