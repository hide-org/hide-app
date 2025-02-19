import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import { Send, Square } from 'lucide-react';

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  onStop?: () => void;
  placeholder?: string;
  maxHeight?: number;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage = (message: string) => console.log('Sending message:', message),
  onStop = () => console.log('Stopping chat...'),
  placeholder = 'Type a message...',
  maxHeight = 200,
  disabled = false,
  className = '',
  isLoading = false,
}) => {
  const [isStopping, setIsStopping] = useState(false);

  // Reset isStopping when isLoading changes
  useEffect(() => {
    setIsStopping(false);
  }, [isLoading]);
  const [message, setMessage] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [message, maxHeight]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !disabled) {
        onSendMessage(message.trim());
        setMessage('');
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full max-w-2xl mx-auto ${className}`.trim()}
    >
      <div className="flex items-end gap-2 p-4 bg-background border rounded-lg shadow-sm">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 resize-none overflow-y-auto min-h-[56px] max-h-[200px] border-0 shadow-none focus:outline-none focus-visible:ring-0 bg-background disabled:bg-muted p-0 m-0"
          style={{ maxHeight: `${maxHeight}px` }}
          rows={1}
        />
        {isLoading ? (
          <Button
            type="button"
            onClick={() => {
              setIsStopping(true);
              onStop();
            }}
            disabled={isStopping}
            size="icon"
            variant="destructive"
            className="h-8 w-8 mb-[3px]"
            aria-label="Stop generation"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : message.trim() && (
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            size="icon"
            className="h-8 w-8 mb-[3px]"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
};
