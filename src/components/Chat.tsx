import { useState, useEffect } from 'react';
import { Conversation, newConversation, Project } from '@/types';
import { Message, newUserMessage } from '@/types/message';
import { ChatArea } from '@/components/ChatArea';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from "@/components/ui/sidebar"
import { H2 } from '@/components/ui/typography';
import { systemPrompt } from '@/lib/prompts';
import { WelcomeFlow } from '@/components/WelcomeFlow';
import { SettingsDialog } from '@/components/SettingsDialog';
import { Toaster } from '@/components/ui/toaster';

export function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Load projects from the database
  const loadProjects = async () => {
    try {
      const loadedProjects = await window.projects.getAll();
      setProjects(loadedProjects);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects');
    }
  };

  // Use loadProjects in the existing useEffect
  useEffect(() => {
    if (!window.projects?.getAll) {
      console.warn('Projects API is not available');
      return;
    }
    loadProjects();
  }, []);

  // Load conversations when project changes
  useEffect(() => {
    if (!window.conversations?.getAll) {
      console.warn('Conversations API is not available');
      return;
    }

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
    if (!window.chat?.onMessage) {
      console.warn('Chat message handler is not available');
      return;
    }

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
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  // Listen for conversation updates
  useEffect(() => {
    if (!window.chat?.onUpdate) {
      console.warn('Chat update handler is not available');
      return;
    }

    const handleUpdate = (conversation: Conversation) => {
      setCurrentConversation(prev => {
        if (!prev || prev.id !== conversation.id) return prev;
        return conversation;
      });

      setConversations(prev => 
        prev.map(c => c.id === conversation.id ? conversation : c)
          .sort((a, b) => b.updatedAt - a.updatedAt)
      );
    };

    const cleanup = window.chat.onUpdate(handleUpdate);
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  // Modify the credentials required listener
  useEffect(() => {
    if (!window.electron?.onCredentialsRequired) {
      console.warn('onCredentialsRequired is not available');
      return;
    }

    const cleanup = window.electron.onCredentialsRequired((error: string) => {
      console.debug('Credentials required:', error);
      setSettingsError(error);
      setShowWelcome(true);  // Show WelcomeFlow instead of SettingsDialog
    });

    return cleanup;
  }, []);

  const handleNewConversation = async (message: string): Promise<void> => {
    if (!selectedProject || !window.conversations?.create || !window.chat?.generateTitle || !window.chat?.start) {
      console.warn('Required APIs are not available');
      return;
    }

    const newConv = newConversation(selectedProject.id);
    newConv.messages.push(newUserMessage(message));
    await window.conversations.create(newConv);
    setCurrentConversation(newConv);
    setConversations(await window.conversations.getAll(selectedProject.id));

    window.chat.generateTitle(newConv.id, message)
      .catch(err => {
        console.error('Error generating title:', err)
        setError(err instanceof Error ? err.message : 'Title generation failed. See logs or console for details.')
      });

    window.chat.start(newConv.id, systemPrompt(selectedProject))
      .catch(err => {
        console.error('Error starting chat:', err)
        setError(err instanceof Error ? err.message : 'Chat failed. See logs or console for details.')
      });
  };

  const handleStop = async () => {
    if (!window.chat?.stop) {
      console.warn('Stop API is not available');
      return;
    }

    if (currentConversation) {
      try {
        await window.chat.stop(currentConversation.id);
      } catch (err) {
        console.error('Error stopping chat:', err);
        setError(err instanceof Error ? err.message : 'Failed to stop chat');
      }
    }
  };

  const handleNewMessage = async (conversationId: string, message: string): Promise<void> => {
    if (!window.conversations?.update || !window.chat?.start) {
      console.warn('Required APIs are not available');
      return;
    }

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
        .catch(err => {
          console.error('Error saving conversation:', err)
          setError(err instanceof Error ? err.message : 'Error saving conversation. See logs or console for details.')
        });
      return updatedConversation;
    });

    setConversations(await window.conversations.getAll(selectedProject?.id));

    // Start chat processing
    window.chat.start(
      conversationId,
      systemPrompt(selectedProject)
    ).catch(err => {
      console.error('Error starting chat:', err)
      setError(err instanceof Error ? err.message : 'Chat failed. See logs or console for details.')
    });
  }

  const onSaveProject = async (project: Project) => {
    if (!window.projects?.update && !window.projects?.create) {
      console.warn('Projects API is not available');
      return;
    }

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
    if (!window.projects?.delete) {
      console.warn('Projects API is not available');
      return;
    }

    try {
      const updatedProjects = await window.projects.delete(project.id);
      setProjects(updatedProjects);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const onDeleteConversation = async (id: string) => {
    if (!window.conversations?.delete || !window.conversations?.getAll) {
      console.warn('Conversations API is not available');
      return;
    }

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
    if (!window.conversations?.update || !window.conversations?.getAll) {
      console.warn('Conversations API is not available');
      return;
    }

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
          onSettingsClick={() => setShowSettings(true)}
          // onSettingsClick={() => setShowWelcome(true)} to test welcome flow
        />
        {selectedProject ? (
          <ChatArea
            conversation={currentConversation}
            onNewConversation={handleNewConversation}
            onNewMessage={handleNewMessage}
            onStop={handleStop}
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
      <WelcomeFlow 
        open={showWelcome}
        onOpenChange={setShowWelcome}
        onComplete={() => {
          setShowWelcome(false);
          loadProjects();  // Add this line to refresh projects
        }}
      />
      <SettingsDialog 
        open={showSettings}
        onOpenChange={setShowSettings}
        error={settingsError}
      />
      <Toaster />
    </div>
  );
}
