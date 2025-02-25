import * as React from "react"
import { Folder, MessageSquare, MoreHorizontal, Plus, Settings } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { Conversation, Project } from '../types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { formatTimestamp } from "../lib/utils"
import { ProjectDialog } from "./ProjectDialog"
import { DeleteProjectDialog } from "./DeleteProjectDialog"
import { ChatDialog } from "./ChatDialog"
import { DeleteChatDialog } from "./DeleteChatDialog"
import { cn } from "@/lib/utils"
import { Logo } from "./ui/logo"
import { ModeToggle } from "./ModeToggle"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


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
  const { theme = 'system' } = useTheme()
  const { state: sidebarState } = useSidebar()
  const [projectToEdit, setProjectToEdit] = React.useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = React.useState<Project | null>(null);
  const [chatToEdit, setChatToEdit] = React.useState<Conversation | null>(null);
  const [chatToDelete, setChatToDelete] = React.useState<Conversation | null>(null);

  // Get the system theme preference
  const systemTheme = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    : 'light'

  // Determine the effective theme
  const effectiveTheme = theme === 'system' ? systemTheme : theme

  return (
    <Sidebar variant="sidebar" collapsible="icon">
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

      <SidebarHeader className={cn(
        "pt-4 flex flex-col",
        sidebarState === "collapsed" ? "px-2 justify-center h-fit" : "pl-4 pb-4"
      )}>
        <div className={cn(
          "flex",
          sidebarState === "collapsed" 
            ? "flex-col items-center justify-center space-y-4 mt-10 mb-2"
            : "flex-row items-center justify-between mt-8"
        )}>
          <Logo 
            className={cn(
              "h-10 w-auto transition-colors duration-200",
              effectiveTheme === 'dark' ? "stroke-white" : "stroke-black"
            )}
          />
          <SidebarTrigger className="sidebar-trigger" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Projects
          </SidebarGroupLabel>
          <SidebarGroupAction title="Add Project" onClick={() => setProjectToEdit({} as Project)}>
            <Plus /> <span className="sr-only">Add Project</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map((project) => (
                <SidebarMenuItem
                  key={project.name}
                  className={cn(
                    selectedProject?.name === project.name ? 'bg-accent rounded-md' : '',
                    'group/menu-item relative'
                  )}
                >
                  <SidebarMenuButton
                    onClick={() => onSelectProject(project)}
                    tooltip={project.name}
                    asChild
                  >
                    <a href="#">
                      <Folder className="shrink-0" />
                      <span>{project.name}</span>
                    </a>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
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
          <SidebarGroupLabel>
            Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.map((conversation) => (
                <SidebarMenuItem
                  key={conversation.id}
                  className={cn(
                    selectedConversation?.id === conversation.id ? 'bg-accent rounded-[var(--radius)]' : '',
                    'group/menu-item relative'
                  )}
                >
                  <SidebarMenuButton
                    onClick={() => onSelectConversation(conversation)}
                    tooltip={conversation.title}
                    asChild
                  >
                    <a title={formatTimestamp(conversation.updatedAt)} href="#">
                      <MessageSquare className="shrink-0" />
                      <span>{conversation.title}</span>
                    </a>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
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
      <SidebarFooter className="border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onSettingsClick}
                    className="h-10 w-10 group-data-[state=collapsed]:h-8 group-data-[state=collapsed]:w-8 hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground"
                  >
                    <Settings className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Provider settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Separator orientation="vertical" className="h-4 bg-sidebar-border group-data-[state=collapsed]:hidden" />
          </div>
          <div className="flex items-center gap-2 group-data-[state=collapsed]:hidden">
            <span className="text-sidebar-foreground">Theme</span>
            <ModeToggle className="hover:bg-sidebar-accent" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
