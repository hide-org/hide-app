import * as React from "react"
import { MoreHorizontal, Plus } from "lucide-react"
import { Conversation, Project } from '../types'
import { UserSwitcher } from "./UserSwitcher"
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
import { ProjectDialog } from "./ProjectDialog"
import { DeleteProjectDialog } from "./DeleteProjectDialog"
import { ChatDialog } from "./ChatDialog"
import { DeleteChatDialog } from "./DeleteChatDialog"
import { AccountDialog } from "./AccountDialog"


interface AppSidebarProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (c: Conversation) => void;
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (p: Project) => void;
  onSaveProject?: (p: Project) => void;
  onDeleteProject?: (p: Project) => void;
  onDeleteConversation?: (id: string) => void;
  onRenameChat?: (chat: Conversation) => void;
  onSettingsClick: () => void;
}

export function AppSidebar({
  conversations = [],
  selectedConversation,
  onSelectConversation,
  projects = [],
  selectedProject,
  onSelectProject,
  onSaveProject,
  onDeleteProject,
  onDeleteConversation,
  onRenameChat,
  onSettingsClick,
}: AppSidebarProps) {
  const [projectToEdit, setProjectToEdit] = React.useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = React.useState<Project | null>(null);
  const [chatToEdit, setChatToEdit] = React.useState<Conversation | null>(null);
  const [chatToDelete, setChatToDelete] = React.useState<Conversation | null>(null);
  const [isAccountOpen, setIsAccountOpen] = React.useState(false);
  const [accountVersion, setAccountVersion] = React.useState(0);

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
      <DeleteProjectDialog
        project={projectToDelete}
        open={projectToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setProjectToDelete(null);
        }}
        onDelete={onDeleteProject}
      />
      <ChatDialog
        chat={chatToEdit}
        open={chatToEdit !== null}
        onOpenChange={(open) => {
          if (!open) setChatToEdit(null);
        }}
        onSave={(chat) => {
          if (onRenameChat) {
            onRenameChat(chat);
          }
        }}
      />
      <DeleteChatDialog
        chat={chatToDelete}
        open={chatToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setChatToDelete(null);
        }}
        onDelete={onDeleteConversation}
      />
      <AccountDialog
        open={isAccountOpen}
        onOpenChange={(open) => {
          setIsAccountOpen(open);
          if (!open) {
            // Increment version to trigger UserSwitcher refresh
            setAccountVersion(v => v + 1);
          }
        }}
      />

      <SidebarHeader className="space-y-4 p-4">
        <UserSwitcher 
          onSettingsClick={onSettingsClick}
          onAccountClick={() => setIsAccountOpen(true)}
          version={accountVersion}
        />
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
                      <DropdownMenuItem onClick={() => setProjectToDelete(project)}>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction>
                        <MoreHorizontal />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem onClick={() => setChatToEdit(conversation)}>
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setChatToDelete(conversation)}>
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
