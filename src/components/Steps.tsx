import * as React from "react"
import { cn } from "@/lib/utils"

interface StepsProps {
  steps: number
  currentStep: number
  className?: string
}

export function Steps({ steps, currentStep, className }: StepsProps) {
  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length: steps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-colors duration-200",
            i === currentStep
              ? "bg-primary"
              : i < currentStep
              ? "bg-primary/60"
              : "bg-muted"
          )}
        />
      ))}
    </div>
  )
} 