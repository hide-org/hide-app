import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import 'highlight.js/styles/atom-one-dark.css';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'tool';
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
      <div className="flex-1 text-gray-900 dark:text-gray-100 leading-relaxed">
        <ReactMarkdown
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Headers
            h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6" {...props}/>,
            h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 mt-5" {...props}/>,
            h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-3 mt-4" {...props}/>,
            // Paragraphs and lists
            p: ({node, ...props}) => <p className="mb-4" {...props}/>,
            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4" {...props}/>,
            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4" {...props}/>,
            li: ({node, ...props}) => <li className="mb-1" {...props}/>,
            // Code blocks
            code: ({node, inline, className, children, ...props}) => {
              const isInline = inline || !className?.includes('language-');
              return (
                <code className={`font-mono ${isInline ? 'text-sm bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5' : 'block text-sm text-gray-100 bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto'}`} {...props}>
                  {children}
                </code>
              );
            },
            // Blockquotes
            blockquote: ({node, ...props}) => (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic" {...props}/>
            ),
            // Links
            a: ({node, ...props}) => (
              <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props}/>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};
