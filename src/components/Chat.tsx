import { MessageParam } from '@anthropic-ai/sdk/src/resources/messages';
import { v4 as uuidv4 } from 'uuid';
import { useState, useCallback, useEffect } from 'react';
import { Conversation, Project } from '../types';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { H1, H2, H3 } from '@/components/ui/typography';
import { initializeClaudeService, getClaudeService } from '../lib/claude';
import { getAnthropicApiKey, isApiKeyConfigured } from '../lib/config';
import { projectPrompt } from '../lib/prompts';
import { loadConversations, saveConversations } from '../lib/storage';
import { useMessageConversion } from '../hooks/useMessageConversion';

const DEFAULT_CONVERSATION_TITLE = 'Untitled Chat';

// Projects are now loaded from the database

export const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const message: MessageParam = {
      role: 'user',
      content: input.trim(),
    };

    let messages = [...currentConversation.messages, message];
    updateConversation({
      ...currentConversation,
      messages: messages,
      updatedAt: Date.now(),
    });
    setInput('');
    setIsLoading(true);

    const shouldGenerateTitle = messages.length === 1 || currentConversation.title === DEFAULT_CONVERSATION_TITLE;

    try {
      const claudeService = getClaudeService();

      // Clone messages for the API call
      const _messages = [...messages];
      if (selectedProject) {
        // Apply project prompt to the first message
        _messages[0] = { ..._messages[0], content: projectPrompt(selectedProject, _messages[0].content as string) };
      }

      console.log('Messages:', _messages);

      for await (const response of claudeService.sendMessage(_messages)) {
        messages = [...messages, response];
        updateConversation({
          ...currentConversation,
          messages: messages,
          updatedAt: Date.now(),
        });
      }

      if (shouldGenerateTitle) {
        claudeService.generateTitle(messages[0]?.content as string || input.trim())
          .then(title => {
            updateConversation({
              ...currentConversation,
              messages: messages,
              title: title,
              updatedAt: Date.now()
            });
          })
          .catch(error => {
            console.error('Error generating title:', error);
          });
      }

      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const updateConversation = (c: Conversation) => {
    setCurrentConversation(c)
    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConversation.id ? c : conv
      )
    );
  }

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  const newConversation = () => {
    const timestamp = Date.now();
    const c: Conversation = {
      id: uuidv4(),
      title: DEFAULT_CONVERSATION_TITLE,
      messages: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setConversations(prev => [c, ...prev]);
    setCurrentConversation(c);
  }

  const currentMessages = useMessageConversion(currentConversation?.messages);

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

  const title = () => {
    const hour = new Date().getHours();
    let greeting;

    if (hour >= 5 && hour < 12) {
      greeting = 'Good morning';
    } else if (hour >= 12 && hour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }

    if (selectedProject?.name) {
      return `${greeting}, how may I assist you with ${selectedProject.name}?`;
    }

    return `${greeting}, how may I assist you?`;
  }

  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <AppSidebar
          conversations={conversations}
          selectedConversation={currentConversation}
          onSelectConversation={setCurrentConversation}
          onNewChat={newConversation}
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
          onSaveProject={onSaveProject}
          onDeleteProject={onDeleteProject}
        />
        <div className="flex-1 flex flex-col">
          <SidebarTrigger />
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {currentConversation ? (
            <ChatArea
              messages={currentMessages}
              input={input}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onInputChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <div className="flex h-full flex-col justify-center">
              <H2 className="w-full max-w-2xl mx-auto border-0">
                {title()}
              </H2>
              <ChatInput />
            </div>
          )}
        </div>
      </SidebarProvider>
    </div>
  );
};
