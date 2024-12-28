import { Calendar, Home, Inbox, Plus, Search, Settings } from "lucide-react"
import { Button } from './ui/button'
import { Conversation } from '../types'
import { ProjectSwitcher } from "./ProjectSwitcher"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { formatTimestamp } from "../lib/utils"

// Sample projects data - you can move this to a separate config file later
const projects = [
  {
    name: "Personal",
    logo: Home,
    path: "/personal",
  },
  {
    name: "Work",
    logo: Inbox,
    path: "/work",
  },
  {
    name: "Research",
    logo: Search,
    path: "/research",
  },
  {
    name: "Archive",
    logo: Calendar,
    path: "/archive",
  },
  {
    name: "Settings",
    logo: Settings,
    path: "/settings",
  }
]

interface AppSidebarProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (c: Conversation) => void;
  onNewChat: () => void;
}

export function AppSidebar({
  conversations = [],
  selectedConversation,
  onSelectConversation,
  onNewChat,
}: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="space-y-4 p-4">
        <ProjectSwitcher projects={projects} />
        <Button
          onClick={onNewChat}
          className="w-full"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.map((conversation) => (
                <SidebarMenuItem
                  key={conversation.id}
                  className={selectedConversation?.id === conversation.id ? 'bg-accent' : ''}
                >
                  <SidebarMenuButton
                    onClick={() => onSelectConversation(conversation)}
                    asChild
                  >
                    <a title={formatTimestamp(conversation.updatedAt)} href="#">
                      <span>{conversation.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
