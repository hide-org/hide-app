import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from 'react';
import { Conversation, newConversation, Project } from '../types';
import { ChatArea } from './ChatArea';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from "@/components/ui/sidebar"
import { initializeClaudeService } from '../lib/claude';
import { getAnthropicApiKey, isApiKeyConfigured } from '../lib/config';
import { loadConversations, saveConversations } from '../lib/storage';


const DEFAULT_PROJECT: Project = {
  id: uuidv4(),
  name: 'General',
  path: '/',
  description: 'General project',
};

export const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(newConversation());
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(DEFAULT_PROJECT);
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

  // Load conversations from local storage
  useEffect(() => {
    const loadedConversations = loadConversations();
    setConversations(loadedConversations);
  }, []);

  // Save conversation whenever they change
  useEffect(() => {
    saveConversations(conversations.sort((a, b) => b.updatedAt - a.updatedAt));
  }, [conversations])

  const updateConversation = (c: Conversation) => {
    setCurrentConversation(c)
    setConversations(prev => {
      if (prev.some(conv => conv.id === c.id)) {
        return prev.map(conv =>
          conv.id === c.id ? c : conv
        );
      }
      return [...prev, c];
    });
  }

  const onNewChat = () => {
    const c: Conversation = newConversation();
    setConversations(prev => [c, ...prev]);
    setCurrentConversation(c);
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
          onSelectProject={setSelectedProject}
          onSaveProject={onSaveProject}
          onDeleteProject={onDeleteProject}
        />
        <ChatArea
          conversation={currentConversation}
          onUpdateConversation={updateConversation}
          project={selectedProject}
          error={error}
          onError={setError}
        />
      </SidebarProvider>
    </div>
  );
};
