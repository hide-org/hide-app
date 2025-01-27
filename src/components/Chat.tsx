import { useState, useEffect } from 'react';
import { Conversation, newConversation, Project } from '../types';
import { ChatArea } from './ChatArea';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from "@/components/ui/sidebar"
import { H2 } from '@/components/ui/typography';
import { CoreMessage } from 'ai';
import { systemPrompt } from '@/lib/prompts';

const DummyConversation: Conversation = {
  id: 'new',
  title: 'Untitled Chat',
  messages: [],
  projectId: 'new',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation>(DummyConversation);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check API key status
  useEffect(() => {
    const checkApiKey = async () => {
      const isConfigured = await window.llm.checkApiKey();
      if (!isConfigured) {
        setError('API key not configured. Please configure your API key in settings.');
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

  // Listen for chat messages
  useEffect(() => {
    const handleMessage = (
      conversationId: string,
      message: CoreMessage
    ) => {
      console.log(`Received message from conversation ${conversationId}`)
      console.dir(message)
      // Update conversation in our list
      setConversations(prev =>
        prev.map(conversation =>
          conversation.id === conversationId
            ? {
              ...conversation,
              messages: [...conversation.messages, message],
              updatedAt: Date.now()
            }
            : conversation
        )
      );

      // Update current conversation if it's the active one
      setCurrentConversation(prev => {
        if (!prev || prev.id !== conversationId) return prev;
        return {
          ...prev,
          messages: [...prev.messages, message],
          updatedAt: Date.now()
        };
      });
    };

    const cleanup = window.chat.onMessage(handleMessage);
    return cleanup;
  }, []);

  const handleSendMessage = async (conversationId: string, message: string) => {
    try {
      // If no conversation exists, create one
      let targetConversation = conversations.find(c => c.id === conversationId);
      if (!targetConversation) {
        if (!selectedProject) throw new Error('No project selected');

        console.log('Creating new conversation');
        const newConv = newConversation(selectedProject.id);
        await window.conversations.create(newConv);
        targetConversation = newConv;

        setConversations(prev => [...prev, newConv]);
        setCurrentConversation(newConv);
      }

      // Add user message to conversation
      const userMessage: CoreMessage = {
        role: 'user',
        content: message
      };

      await window.conversations.update({
        ...targetConversation,
        messages: [...targetConversation.messages, userMessage],
        updatedAt: Date.now()
      });

      setCurrentConversation(prev => {
        if (!prev || prev.id !== conversationId) return prev;
        return {
          ...prev,
          messages: [...prev.messages, userMessage],
          updatedAt: Date.now()
        };
      });

      // Start chat processing
      await window.chat.start(
        targetConversation.id,
        systemPrompt(selectedProject)
      );

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  // const onAddMessage = async (conversationId: string, message: CoreMessage) => {
  //   try {
  //     // Get the current conversation and update its messages
  //     setCurrentConversation(prev => {
  //       console.log('Updating conversation:', prev);
  //       if (!prev || prev.id !== conversationId) return prev;
  //       const updatedConversation = {
  //         ...prev,
  //         messages: [...prev.messages, message],
  //         updatedAt: Date.now()
  //       };
  //       // Update in DB
  //       window.conversations.update(updatedConversation)
  //         .catch(err => console.error('Error saving conversation:', err));
  //       return updatedConversation;
  //     });
  //
  //     // Update the conversations list
  //     const conversations = await window.conversations.getAll(selectedProject?.id);
  //     setConversations(conversations);
  //   } catch (err) {
  //     console.error('Error adding message:', err);
  //     setError('Failed to add message');
  //   }
  // }

  const onUpdateTitle = async (conversationId: string, title: string) => {
    try {
      // Update current conversation title
      setCurrentConversation(prev => {
        if (!prev || prev.id !== conversationId) return prev;
        const updatedConversation = {
          ...prev,
          title,
          updatedAt: Date.now()
        };
        // Update in DB
        window.conversations.update(updatedConversation)
          .catch(err => console.error('Error saving conversation:', err));
        return updatedConversation;
      });

      // Update conversations list
      const conversations = await window.conversations.getAll(selectedProject?.id);
      setConversations(conversations);
    } catch (err) {
      console.error('Error updating title:', err);
      setError('Failed to update title');
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
        setCurrentConversation(DummyConversation);
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
    setSelectedProject(project);
    // Reset chat area by creating a new conversation
    setCurrentConversation(DummyConversation);
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
            // onNewConversation={onNewConversation}
            // onAddMessage={onAddMessage}
            onSendMessage={(message) => handleSendMessage(currentConversation.id, message)}
            // onUpdateTitle={onUpdateTitle}
            project={selectedProject}
            error={error}
          // onError={setError}
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
