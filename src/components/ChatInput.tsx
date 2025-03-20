import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Model } from "@/types/model";
import { Brain, Send, Square } from "lucide-react";
import React, {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

interface ChatInputProps {
  onSendMessage?: (message: string, model?: string, thinking?: boolean) => void;
  onStop?: () => void;
  placeholder?: string;
  maxHeight?: number;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
  isStopping?: boolean;
  selectedModelId?: string;
  onModelChange?: (modelId: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage = (message: string) => console.log("Sending message:", message),
  onStop = () => console.log("Stopping chat..."),
  placeholder = "Type a message...",
  maxHeight = 200,
  disabled = false,
  className = "",
  isLoading = false,
  isStopping = false,
  selectedModelId = "",
  onModelChange = () => {},
}) => {
  const [message, setMessage] = useState<string>("");
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(true);
  const [thinking, setThinking] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Get current model object
  const selectedModel = models.find((m) => m.id === selectedModelId);

  // Fetch available models when component mounts
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const availableModels = await window.models.getAll();
        setModels(availableModels);
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  // Disable thinking toggle if model doesn't support it
  useEffect(() => {
    if (selectedModel && !selectedModel?.capabilities?.thinking) {
      setThinking(false);
    }
  }, [selectedModelId, selectedModel]);

  // Auto-resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [message, maxHeight]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), selectedModelId, thinking);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !disabled) {
        onSendMessage(message.trim(), selectedModelId, thinking);
        setMessage("");
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Group models by provider
  const groupedModels = models.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, Model[]>,
  );

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
          <Select
            value={selectedModelId}
            onValueChange={onModelChange}
            disabled={disabled || isLoading || isLoadingModels}
          >
            <SelectTrigger
              className={cn(
                "text-xs h-8 border-0 bg-transparent",
                "hover:bg-muted transition-colors",
                "focus:ring-0 focus:ring-offset-0",
              )}
            >
              <SelectValue
                placeholder={
                  isLoadingModels ? "Loading models..." : "Select model"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(groupedModels).length === 0 && (
                <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                  {isLoadingModels
                    ? "Loading available models..."
                    : "No models available"}
                </div>
              )}

              {/* Group models by provider */}
              {Object.entries(groupedModels).map(
                ([provider, providerModels], index) => (
                  <SelectGroup key={provider}>
                    <SelectLabel className="px-2 py-1.5 text-xs font-semibold capitalize">
                      {provider}
                    </SelectLabel>
                    <SelectSeparator />
                    {providerModels.map((model) => (
                      <SelectItem
                        key={model.id}
                        value={model.id}
                        disabled={!model.available}
                        className={!model.available ? "opacity-50" : ""}
                      >
                        {model.name}
                        {!model.available && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (No API key)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                    {index < Object.keys(groupedModels).length - 1 && (
                      <SelectSeparator className="my-1" />
                    )}
                  </SelectGroup>
                ),
              )}
            </SelectContent>
          </Select>

          {/* Only show thinking toggle for models that support it */}
          {selectedModel && selectedModel.capabilities?.thinking && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setThinking(!thinking)}
                    disabled={disabled || isLoading}
                    className={cn(
                      "h-8 w-8 border-0",
                      "transition-colors",
                      thinking ? "bg-accent" : "hover:bg-muted",
                    )}
                    aria-label={
                      thinking
                        ? "Disable thinking mode"
                        : "Enable thinking mode"
                    }
                  >
                    <Brain className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{thinking ? "Disable thinking" : "Enable thinking"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
        ) : (
          message.trim() && (
            <Button
              type="submit"
              disabled={!message.trim() || disabled}
              size="icon"
              className="h-8 w-8"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )
        )}
      </div>
    </form>
  );
};
