import { useState, useEffect } from 'react';
import { Conversation, Project } from '../types';
import { ChatArea } from './ChatArea';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from "@/components/ui/sidebar"
import { H2 } from '@/components/ui/typography';


export const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check API key status
  useEffect(() => {
    const checkApiKey = async () => {
      const isConfigured = await window.claude.checkApiKey();
      if (!isConfigured) {
        setError('API key not configured. Please set up your Anthropic API key.');
      }
    };
    checkApiKey();
  }, []);

  // Load projects from the database
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const loadedProjects = await window.projects.getAll();
        setProjects(loadedProjects);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects');
      }
    };
    loadProjects();
  }, []);

  // Load conversations when project changes
  useEffect(() => {
    if (selectedProject) {
      const loadConversationsForProject = async () => {
        try {
          const loadedConversations = await window.conversations.getAll(selectedProject.id);
          setConversations(loadedConversations);
        } catch (err) {
          console.error('Error loading conversations:', err);
          setError('Failed to load conversations');
        }
      };
      loadConversationsForProject();
    } else {
      setConversations([]);
    }
  }, [selectedProject]);

  const onUpdatedConversation = async (c: Conversation) => {
    try {
      const conversation = await window.conversations.update(c);
      setCurrentConversation(conversation);

      if (selectedProject) {
        const conversations = await window.conversations.getAll(selectedProject.id);
        setConversations(conversations);
      }
    } catch (err) {
      console.error('Error updating conversation:', err);
      setError('Failed to update conversation');
    }
  }

  const onNewConversation = async (c: Conversation) => {
    try {
      const conversation = await window.conversations.create(c);
      setCurrentConversation(conversation);

      if (selectedProject) {
        const conversations = await window.conversations.getAll(selectedProject.id);
        setConversations(conversations);
      }
    } catch (err) {
      console.error('Error creating new conversation:', err);
      setError('Failed to create new conversation');
    }
  }

  const onSaveProject = async (project: Project) => {
    try {
      const updatedProjects = projects.some(p => p.id === project.id)
        ? await window.projects.update(project)
        : await window.projects.create(project);
      setProjects(updatedProjects);
    } catch (err) {
      console.error('Error saving project:', err);
      setError('Failed to save project');
    }
  };

  const onDeleteProject = async (project: Project) => {
    try {
      const updatedProjects = await window.projects.delete(project.id);
      setProjects(updatedProjects);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const onDeleteConversation = async (id: string) => {
    try {
      await window.conversations.delete(id);
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }

      if (selectedProject) {
        const conversations = await window.conversations.getAll(selectedProject.id);
        setConversations(conversations);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
    }
  };

  const onRenameChat = async (chat: Conversation) => {
    try {
      await window.conversations.update(chat);
      if (currentConversation?.id === chat.id) {
        setCurrentConversation(chat);
      }
      
      if (selectedProject) {
        const conversations = await window.conversations.getAll(selectedProject.id);
        setConversations(conversations);
      }
    } catch (err) {
      console.error('Error renaming chat:', err);
      setError('Failed to rename chat');
    }
  };

  const onSelectProject = (project: Project | null) => {
    console.log('Selected project:', project);
    setSelectedProject(project);
    // Reset chat area by creating a new conversation
    if (!project) {
      setCurrentConversation(null);
      return;
    }
    setCurrentConversation(null);
  };

  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <AppSidebar
          conversations={conversations}
          selectedConversation={currentConversation}
          onSelectConversation={setCurrentConversation}
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={onSelectProject}
          onSaveProject={onSaveProject}
          onDeleteProject={onDeleteProject}
          onDeleteConversation={onDeleteConversation}
          onRenameChat={onRenameChat}
        />
        {selectedProject ? (
          <ChatArea
            conversation={currentConversation}
            onNewConversation={onNewConversation}
            onUpdateConversation={onUpdatedConversation}
            project={selectedProject}
            error={error}
            onError={setError}
          />
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
            <H2 className="mb-4">Welcome to Hide</H2>
            <p className="text-muted-foreground max-w-md">
              Select a project from the sidebar to start a conversation.
            </p>
          </div>
        )}

      </SidebarProvider>
    </div>
  );
};
