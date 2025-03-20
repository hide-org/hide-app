import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import { Send, Square, Brain } from 'lucide-react';

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage?: (message: string, model?: string, thinking?: boolean) => void;
  onStop?: () => void;
  placeholder?: string;
  maxHeight?: number;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
  isStopping?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage = (message: string) => console.log('Sending message:', message),
  onStop = () => console.log('Stopping chat...'),
  placeholder = 'Type a message...',
  maxHeight = 200,
  disabled = false,
  className = '',
  isLoading = false,
  isStopping = false,
}) => {
  const [message, setMessage] = useState<string>('');
  const [model, setModel] = useState<string>('claude');
  const [thinking, setThinking] = useState<boolean>(false);
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
      onSendMessage(message.trim(), model, thinking);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !disabled) {
        onSendMessage(message.trim(), model, thinking);
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
      <div className="flex items-start gap-2 p-4 pb-12 bg-background border rounded-lg shadow-sm relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 resize-none overflow-y-auto min-h-[32px] max-h-[200px] border-0 shadow-none focus:outline-none focus-visible:ring-0 bg-background disabled:bg-muted p-0 m-0"
          style={{ maxHeight: `${maxHeight}px` }}
          rows={1}
        />

        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <Select value={model} onValueChange={setModel} disabled={disabled || isLoading}>
            <SelectTrigger
              className={cn(
                "text-xs h-8 border-0 bg-transparent",
                "hover:bg-muted transition-colors",
                "focus:ring-0 focus:ring-offset-0",
              )}
            >
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
              <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
              <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
            </SelectContent>
          </Select>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setThinking(!thinking)}
                  disabled={disabled || isLoading}
                  className={cn("h-8 w-8 border-0", "transition-colors", thinking ? "bg-accent" : "hover:bg-muted")}
                  aria-label={thinking ? "Disable thinking mode" : "Enable thinking mode"}
                >
                  <Brain className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{thinking ? "Disable thinking" : "Enable thinking"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {isLoading ? (
          <Button
            type="button"
            onClick={onStop}
            disabled={isStopping}
            size="icon"
            variant="destructive"
            className="h-8 w-8"
            aria-label="Stop generation"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : message.trim() && (
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            size="icon"
            className="h-8 w-8"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
};
