import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import 'highlight.js/styles/atom-one-dark.css';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, isLoading }) => {
  if (isLoading && role === 'assistant') {
    return (
      <div className="flex items-start space-x-4 p-4">
        <Avatar className="w-8 h-8 border">
          <AvatarImage src="/bot-avatar.png" alt="AI" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
          <span className="text-gray-500">Thinking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-4 p-4 ${role === 'user' ? 'bg-gray-50' : 'bg-white'}`}>
      {role === 'assistant' ? (
        <Avatar className="w-8 h-8 border">
          <AvatarImage src="/bot-avatar.png" alt="AI" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="w-8 h-8 border">
          <AvatarImage src="/user-avatar.png" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 prose prose-sm max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};