import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"

import { ProjectSwitcher } from "@/components/ProjectSwitcher"
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

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]

const projects = [
  {
    name: "Project 1",
    logo: Home,
    path: "/project-1",
  },
  {
    name: "Project 2",
    logo: Inbox,
    path: "/project-2",
  },
  {
    name: "Project 3",
    logo: Calendar,
    path: "/project-3",
  },
  {
    name: "Project 4",
    logo: Search,
    path: "/project-4",
  },
  {
    name: "Project 5",
    logo: Settings,
    path: "/project-5",
  }
]

const chats = [
  {
    id: "1",
    title: "React Markdown Code Block Rendering Issue",
  }
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <ProjectSwitcher projects={projects} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <a href="#">
                      <span>{item.title}</span>
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
