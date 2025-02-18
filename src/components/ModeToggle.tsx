import { Monitor, Moon, Sun } from "lucide-react"
import { Button } from "./ui/button"
import { useTheme } from "./ThemeProvider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <TooltipProvider>
      <div className="inline-flex h-8 w-fit items-center rounded-full bg-muted p-1 space-x-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme("light")}
              className={`h-6 w-6 rounded-full p-0 ${
                theme === "light" ? "bg-background shadow-sm" : ""
              }`}
            >
              <Sun className="h-4 w-4" />
              <span className="sr-only">Light mode</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Light</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme("dark")}
              className={`h-6 w-6 rounded-full p-0 ${
                theme === "dark" ? "bg-background shadow-sm" : ""
              }`}
            >
              <Moon className="h-4 w-4" />
              <span className="sr-only">Dark mode</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dark</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme("system")}
              className={`h-6 w-6 rounded-full p-0 ${
                theme === "system" ? "bg-background shadow-sm" : ""
              }`}
            >
              <Monitor className="h-4 w-4" />
              <span className="sr-only">System mode</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>System</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
