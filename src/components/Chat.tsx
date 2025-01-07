import { useState, useEffect } from 'react';
import { Conversation, newConversation, Project } from '../types';
import { ChatArea } from './ChatArea';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from "@/components/ui/sidebar"
import { initializeClaudeService } from '../lib/claude';
import { getAnthropicApiKey, isApiKeyConfigured } from '../lib/config';


export const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Claude service with API key
  useEffect(() => {
    const apiKey = getAnthropicApiKey();
    if (isApiKeyConfigured()) {
      initializeClaudeService(apiKey);
    } else {
      setError('API key not configured. Please set up your Anthropic API key.');
    }
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

  // Deprecated, use onNewConversation instead
  const onNewChat = async () => {
    if (!selectedProject) return;
    try {
      const c: Conversation = newConversation(selectedProject.id);
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
          onNewChat={onNewChat}
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={onSelectProject}
          onSaveProject={onSaveProject}
          onDeleteProject={onDeleteProject}
          onDeleteConversation={onDeleteConversation}
        />
        <ChatArea
          conversation={currentConversation}
          onNewConversation={onNewConversation}
          onUpdateConversation={onUpdatedConversation}
          project={selectedProject}
          error={error}
          onError={setError}
        />
      </SidebarProvider>
    </div>
  );
};
