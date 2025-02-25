import * as React from "react"
import { cn } from "@/lib/utils"

interface TitleBarProps {
  className?: string
}

export function TitleBar({ className }: TitleBarProps) {
  return (
    <div className={cn("titlebar-region flex items-center justify-center px-4", className)}>  
      <div className="flex items-center justify-start flex-1">
        <span className="text-sm font-medium pl-14 font-mono text-muted-foreground">Hide</span>
      </div>
    </div>
  )
} 