import * as React from "react"
import { Calendar, Home, Inbox, MoreHorizontal, Plus, Search, Settings } from "lucide-react"
import { Button } from './ui/button'
import { Conversation, Project } from '../types'
import { ProjectSwitcher } from "./ProjectSwitcher"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { formatTimestamp } from "../lib/utils"
import { ProjectDialog } from "./Project"


interface AppSidebarProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (c: Conversation) => void;
  onNewChat: () => void;
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (p: Project) => void;
  onSaveProject?: (p: Project) => void;
}

export function AppSidebar({
  conversations = [],
  selectedConversation,
  onSelectConversation,
  onNewChat,
  projects = [],
  selectedProject,
  onSelectProject,
  onSaveProject,
}: AppSidebarProps) {
  const [projectToEdit, setProjectToEdit] = React.useState<Project | null>(null);
  return (
    <Sidebar>
      <ProjectDialog 
        project={projectToEdit}
        open={projectToEdit !== null}
        onOpenChange={(open) => {
          if (!open) setProjectToEdit(null);
        }}
        onSave={onSaveProject}
      />
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
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupAction title="Add Project" onClick={() => setProjectToEdit({} as Project)}>
            <Plus /> <span className="sr-only">Add Project</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map((project) => (
                <SidebarMenuItem
                  key={project.name}
                  className={selectedProject?.name === project.name ? 'bg-accent' : ''}
                >
                  <SidebarMenuButton
                    onClick={() => onSelectProject(project)}
                    asChild
                  >
                    <a href="#">
                      <span>{project.name}</span>
                    </a>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction>
                        <MoreHorizontal />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem onClick={() => setProjectToEdit(project)}>
                        <span>Edit Project</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log('Delete project')}>
                        <span>Delete Project</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
