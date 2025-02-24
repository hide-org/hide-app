import { useState } from 'react';
import { ChevronsUpDown } from "lucide-react";
import { UIMessage } from '@/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface ToolUseLogProps {
  toolMessage: UIMessage;
  toolResult?: UIMessage;
}

export const ToolUseLog = ({ toolMessage, toolResult }: ToolUseLogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex items-start space-x-4 px-4"
    >
      <div className="w-8" /> {/* Space for avatar alignment */}
      <div className="flex-1 space-y-1 w-full max-w-2xl ml-4">
        {/* Tool Message (Always Visible) */}
        <CollapsibleTrigger className="flex w-full items-start gap-2">
          <div className="min-w-0 flex-1 text-sm text-muted-foreground font-mono py-1 leading-relaxed hover:text-foreground transition-colors text-left">
            <div className={isOpen ? "whitespace-pre-wrap break-all" : "truncate"} title={!isOpen ? toolMessage.content : undefined}>
              {toolMessage.content}
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-1.5" />
        </CollapsibleTrigger>

        {/* Tool Result (Collapsible) */}
        <CollapsibleContent>
          {toolResult ? (
            <div className={`text-sm font-mono py-2 leading-relaxed whitespace-pre-wrap break-all ${toolResult.isError ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
              {toolResult.content}
            </div>
          ) : (
            <div className="text-sm font-mono py-2 leading-relaxed text-muted-foreground/70 flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
              Waiting for result...
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
