import * as React from "react"
import { cn } from "@/lib/utils"
import { Conversation, Project } from "@/types"

interface TitleBarProps {
  className?: string
  selectedProject?: Project | null
  currentConversation?: Conversation | null
}

export function TitleBar({ className, selectedProject, currentConversation }: TitleBarProps) {
  return (
    <div className={cn("titlebar-region flex items-center px-4", className)}>  
      <div className="flex items-center flex-1 h-full pl-12">
        {selectedProject && (
          <>
            <div className="mx-3 h-4 w-px bg-border" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">{selectedProject.name}</span>
            
            {currentConversation && currentConversation.title && (
              <>
                <span className="mx-2 text-muted-foreground">›</span>
                <span className="text-sm text-muted-foreground truncate max-w-md">
                  {currentConversation.title}
                </span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
} 