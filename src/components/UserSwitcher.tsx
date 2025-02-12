import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

interface UserSwitcherProps {
  onSettingsClick: () => void;
  onAccountClick: () => void;
  version?: number; // Changes to trigger a refresh
}

export function UserSwitcher({ onSettingsClick, onAccountClick, version }: UserSwitcherProps) {
  const { isMobile } = useSidebar()
  const [accountSettings, setAccountSettings] = React.useState({
    username: "",
    email: "",
  })

  // Load account settings when component mounts
  React.useEffect(() => {
    window.account.get().then(settings => {
      if (settings) {
        setAccountSettings({
          username: settings.username,
          email: settings.email,
        });
      }
    });
  }, [version]) // Reload when version changes

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="/user-avatar.png" alt={accountSettings.username} />
                <AvatarFallback className="rounded-lg">
                  {accountSettings.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{accountSettings.username}</span>
                <span className="truncate text-xs">{accountSettings.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="/user-avatar.png" alt={accountSettings.username} />
                  <AvatarFallback className="rounded-lg">
                    {accountSettings.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{accountSettings.username}</span>
                  <span className="truncate text-xs">{accountSettings.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onAccountClick}
              className="gap-2 p-2"
            >
              Account
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onSettingsClick}
              className="gap-2 p-2"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => console.log("Log out clicked")}
              className="gap-2 p-2 text-red-500"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
