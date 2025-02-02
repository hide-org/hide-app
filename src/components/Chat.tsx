import { useState, useEffect } from 'react';
import { Conversation, newConversation, Project } from '@/types';
import { Message, newUserMessage } from '@/types/message';
import { ChatArea } from '@/components/ChatArea';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from "@/components/ui/sidebar"
import { H2 } from '@/components/ui/typography';
import { systemPrompt } from '@/lib/prompts';


export const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      message: Message
    ) => {
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

  // Listen for conversation updates
  useEffect(() => {
    const handleUpdate = (conversation: Conversation) => {
      setCurrentConversation(prev => {
        if (!prev || prev.id !== conversation.id) return prev;
        return conversation;
      });

      setConversations(prev => prev.map(c => c.id === conversation.id ? conversation : c).sort((a, b) => b.updatedAt - a.updatedAt));
    };

    const cleanup = window.chat.onUpdate(handleUpdate);
    return cleanup;
  }, []);

  const handleNewConversation = async (message: string): Promise<void> => {
    if (!selectedProject) return;

    const newConv = newConversation(selectedProject.id);
    newConv.messages.push(newUserMessage(message));
    await window.conversations.create(newConv);
    setCurrentConversation(newConv);
    setConversations(await window.conversations.getAll(selectedProject.id));

    window.chat.generateTitle(newConv.id, message)
      .catch(err => console.error('Error generating title:', err));

    window.chat.start(newConv.id, systemPrompt(selectedProject))
      .catch(err => console.error('Error starting chat:', err));
  };

  const handleNewMessage = async (conversationId: string, message: string): Promise<void> => {
    setCurrentConversation(prev => {
      if (!prev || prev.id !== conversationId) return prev;
      const updatedConversation = {
        ...prev,
        messages: [
          ...prev.messages,
          newUserMessage(message),
        ],
        updatedAt: Date.now()
      };
      // Update in DB
      window.conversations.update(updatedConversation)
        .catch(err => console.error('Error saving conversation:', err));
      return updatedConversation;
    });

    setConversations(await window.conversations.getAll(selectedProject?.id));

    // Start chat processing
    window.chat.start(
      conversationId,
      systemPrompt(selectedProject)
    ).catch(err => console.error('Error starting chat:', err));
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
    setSelectedProject(project);
    // Reset chat area by creating a new conversation
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
            onNewConversation={handleNewConversation}
            onNewMessage={handleNewMessage}
            isLoading={currentConversation?.status === 'active'}
            project={selectedProject}
            error={error}
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
