import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  maxHeight?: number;
  disabled?: boolean;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage = (message: string) => console.log('Sending message:', message),
  placeholder = 'Type a message...',
  maxHeight = 200,
  disabled = false,
  className = '',
}) => {
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
      const form = e.currentTarget.form;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-2xl mx-auto ${className}`.trim()}
      >
        <div className="flex items-end gap-2 p-2 bg-white border rounded-lg shadow-sm">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 resize-none overflow-y-auto min-h-9 border-0 shadow-none focus:outline-none focus-visible:ring-0 disabled:bg-gray-100"
            style={{ maxHeight: `${maxHeight}px` }}
            rows={1}

          />
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            size="icon"
            aria-label="Send message"
          >
            <Send />
          </Button>
        </div>
      </form>
    </>
  );
};
