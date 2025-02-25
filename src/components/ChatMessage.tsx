import { Baby, Bot, Wrench } from 'lucide-react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import 'highlight.js/styles/atom-one-dark.css';
import { UIMessage } from '@/types';

interface ChatMessageProps {
  message: UIMessage;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {

  const getMessageStyle = () => {
    switch (message.role) {
      case 'user':
        return 'bg-muted/50';
      case 'assistant':
        return 'bg-background';
      case 'tool_use':
        return 'bg-blue-500/10 dark:bg-blue-900/20';
      case 'tool_result':
        return (message.isError ?? false) 
          ? 'bg-destructive/10 dark:bg-destructive/20' 
          : 'bg-green-500/10 dark:bg-green-900/20';
      default:
        return 'bg-background';
    }
  };

  const getAvatar = () => {
    switch (message.role) {
      case 'assistant':
        return (
          <Avatar className="w-8 h-8 border">
            <AvatarImage src="/bot-avatar.png" alt="AI" />
            <AvatarFallback>
              <Bot className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
        );
      case 'user':
        return (
          <Avatar className="w-8 h-8 border">
            <AvatarImage src="/user-avatar.png" alt="User" />
            <AvatarFallback>
              <Baby className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
        );
      case 'tool_use':
      case 'tool_result':
        return (
          <Avatar className="w-8 h-8 border">
            <AvatarImage src="/tool-avatar.png" alt="Tool" />
            <AvatarFallback>
              <Wrench className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
        );
    }
  };

  return (
    <div className={`flex items-start space-x-4 p-4`}>
      {getAvatar()}
      <div className={`flex-1 border p-4 rounded-lg text-foreground leading-relaxed w-full max-w-2xl mx-auto ${getMessageStyle()}`}>
        <ReactMarkdown
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Headers
            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 mt-5" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-3 mt-4" {...props} />,
            // Paragraphs and lists
            p: ({ node, ...props }) => <p className="mb-4" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4" {...props} />,
            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
            // Code blocks
            code: ({ node, className, children, ...props }) => {
              const isInline = !className?.includes('language-');
              return (
                <code className={`font-mono ${isInline
                  ? 'text-sm bg-muted rounded px-1.5 py-0.5 max-w-3xl break-words'
                  : 'block text-sm bg-zinc-950 dark:bg-zinc-900 text-zinc-50 p-4 rounded-lg mb-4 overflow-x-auto max-w-3xl whitespace-pre'}`} {...props}>
                  {children}
                </code>
              );
            },
            // Blockquotes
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-muted pl-4 my-4 italic" {...props} />
            ),
            // Links
            a: ({ node, ...props }) => (
              <a className="text-primary hover:underline" {...props} />
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};
