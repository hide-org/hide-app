
import { Card } from './ui/card';

interface ChatPreviewProps {
  id: string;
  title: string;
  isSelected: boolean;
  onClick: () => void;
  updatedAt: number;
}

export const ChatPreview = ({ id, title, isSelected, onClick, updatedAt }: ChatPreviewProps) => {
  // Format the timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Today at ${time}`;
    } else if (isYesterday) {
      return `Yesterday at ${time}`;
    } else {
      return `${date.toLocaleDateString()} ${time}`;
    }
  };

  const timestamp = formatTimestamp(updatedAt);

  return (
    <Card
      className={`p-3 mb-2 cursor-pointer hover:bg-gray-100 ${
        isSelected ? 'bg-gray-100' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col">
        <div className="text-sm font-medium truncate mb-1">{title}</div>
        <div className="text-xs text-gray-500">{timestamp}</div>
      </div>
    </Card>
  );
};
