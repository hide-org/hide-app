import { CoreMessage } from 'ai';
import { BrowserWindow, ipcMain } from 'electron';
import { LLMService } from '@/main/llm';
import { getConversationById, updateConversation } from '@/main/db';
import { Conversation } from '@/types';

export class ChatService {
  private activeChats: Map<string, {
    abortController: AbortController;
  }>;
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.activeChats = new Map();
    this.llmService = llmService;
  }

  // TODO: should we pass system prompt here?
  async startChat(conversationId: string, systemPrompt?: string): Promise<void> {
    if (this.activeChats.has(conversationId)) {
      throw new Error('Chat is already running');
    }

    const conversation = getConversationById(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const abortController = new AbortController();
    this.activeChats.set(conversationId, {
      abortController,
    });

    // Update status to active
    const updatedConversation = {
      ...conversation,
      status: 'active' as const,
      updatedAt: Date.now()
    };
    updateConversation(updatedConversation);
    this.broadcastUpdate(updatedConversation);

    try {
      const onMessage = (message: CoreMessage) => {
        console.log(`Sending message from LLM service`)
        console.dir(message)
        this.handleNewMessage(conversationId, message);
      };

      await this.llmService.sendMessage(
        conversation.messages,
        systemPrompt,
        onMessage,
      );

      // Update status to inactive when done
      const finalConversation = getConversationById(conversationId);
      if (finalConversation) {
        const inactiveConversation = {
          ...finalConversation,
          status: 'inactive' as const,
          updatedAt: Date.now()
        };
        updateConversation(inactiveConversation);
        this.broadcastUpdate(inactiveConversation);
      }
    } catch (error) {
      console.error(`Chat ${conversationId} error:`, error);
      
      // Update status to inactive on error
      const errorConversation = getConversationById(conversationId);
      if (errorConversation) {
        const inactiveConversation = {
          ...errorConversation,
          status: 'inactive' as const,
          updatedAt: Date.now()
        };
        updateConversation(inactiveConversation);
        this.broadcastUpdate(inactiveConversation);
      }
    } finally {
      this.activeChats.delete(conversationId);
    }
  }

  async stopChat(conversationId: string): Promise<void> {
    const chat = this.activeChats.get(conversationId);
    if (!chat) throw new Error('Chat not found or not running');

    chat.abortController.abort();
    this.activeChats.delete(conversationId);

    // Update status to inactive when stopped
    const conversation = getConversationById(conversationId);
    if (conversation) {
      const inactiveConversation = {
        ...conversation,
        status: 'inactive' as const,
        updatedAt: Date.now()
      };
      updateConversation(inactiveConversation);
      this.broadcastUpdate(inactiveConversation);
    }
  }

  async generateTitle(conversationId: string, message: string): Promise<void> {
    const conversation = getConversationById(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    try {
      const title = await this.llmService.generateTitle(message);
      const updatedConversation = {
        ...conversation,
        title,
        updatedAt: Date.now()
      };
      updateConversation(updatedConversation);
      this.broadcastUpdate(updatedConversation);
    } catch (error) {
      console.error(`Error generating title for conversation ${conversationId}:`, error);
      // Don't throw - title generation is not critical
    }
  }

  // async resumeChat(conversationId: string): Promise<void> {
  //   const conversation = await getConversationById(conversationId);
  //   if (!conversation) throw new Error('Conversation not found');
  //   
  //   if (conversation.status !== 'paused') {
  //     throw new Error('Can only resume paused chats');
  //   }
  //
  //   await this.startChat(conversationId);
  // }

  // async createProgrammaticChat(options: {
  //   projectId: string;
  //   initialMessage?: string;
  //   metadata?: Record<string, any>;
  //   systemPrompt?: string;
  // }): Promise<string> {
  //   const conversation = newConversation(options.projectId);
  //   conversation.metadata = options.metadata || {};
  //
  //   if (options.initialMessage) {
  //     conversation.messages.push({
  //       role: 'user',
  //       content: options.initialMessage
  //     });
  //   }
  //
  //   await createConversation(conversation);
  //
  //   if (options.initialMessage) {
  //     // Start chat automatically if initial message provided
  //     await this.startChat(conversation.id, options.systemPrompt);
  //   }
  //
  //   return conversation.id;
  // }

  // private async updateChatStatus(conversationId: string, status: ConversationStatus): Promise<void> {
  //   const conversation = await getConversationById(conversationId);
  //   if (!conversation) return;
  //
  //   await updateConversation({
  //     ...conversation,
  //     status,
  //     updatedAt: Date.now()
  //   });
  //
  //   this.broadcastStatusUpdate(conversationId, status);
  // }

  private async handleNewMessage(conversationId: string, message: CoreMessage): Promise<void> {
    const conversation = getConversationById(conversationId);
    if (!conversation) return;

    console.log(`Saving message (conversation ${conversationId})`)
    console.dir(message)
    updateConversation({
      ...conversation,
      messages: [...conversation.messages, message],
      updatedAt: Date.now()
    });

    this.broadcastMessage(conversationId, message);
  }

  // private broadcastStatusUpdate(conversationId: string, status: ConversationStatus): void {
  //   BrowserWindow.getAllWindows().forEach(window => {
  //     window.webContents.send('chat:statusUpdate', { conversationId, status });
  //   });
  // }

  private broadcastMessage(conversationId: string, message: CoreMessage): void {
    console.log(`Broadcasting message (conversation ${conversationId})`)
    console.dir(message)
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('chat:messageUpdate', { conversationId, message });
    });
  }

  // TODO: here we broadcast the entire conversation including messages which is expensive but
  // but creating a separate broadcast method for each conversation field is not ideal either
  // what can we do?
  private broadcastUpdate(conversation: Conversation): void {
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('chat:update', conversation);
    });
  }
}

export const setupChatHandlers = (chatManager: ChatService) => {
  ipcMain.handle('chat:start', async (_, {
    conversationId,
    systemPrompt
  }) => {
    try {
      return await chatManager.startChat(conversationId, systemPrompt);
    } catch (error) {
      console.error('Error starting chat:', error);
      throw error;
    }
  });

  ipcMain.handle('chat:stop', async (_, { conversationId }) => {
    try {
      return await chatManager.stopChat(conversationId);
    } catch (error) {
      console.error('Error stopping chat:', error);
      throw error;
    }
  });

  ipcMain.handle('chat:generateTitle', async (_, { conversationId, message }) => {
    try {
      return await chatManager.generateTitle(conversationId, message);
    } catch (error) {
      console.error('Error generating title:', error);
      throw error;
    }
  });
}
