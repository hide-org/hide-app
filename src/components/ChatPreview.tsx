import { Message } from '../types';
import { Card } from './ui/card';

interface ChatPreviewProps {
  id: string;
  messages: Message[];
  isSelected: boolean;
  onClick: () => void;
}

export const ChatPreview = ({ id, messages, isSelected, onClick }: ChatPreviewProps) => {
  // Get the first message as the title or use a default
  const title = messages[0]?.content.slice(0, 30) || 'New Chat';
  
  // Get the timestamp from the id (assuming id is timestamp-based)
  const date = new Date(parseInt(id));
  const formattedDate = date.toLocaleDateString();

  return (
    <Card
      className={`p-3 mb-2 cursor-pointer hover:bg-gray-100 ${
        isSelected ? 'bg-gray-100' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col">
        <div className="font-medium truncate">{title}...</div>
        <div className="text-sm text-gray-500">{formattedDate}</div>
      </div>
    </Card>
  );
};