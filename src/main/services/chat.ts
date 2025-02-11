import { BrowserWindow, ipcMain } from 'electron';
import { AnthropicService } from '@/main/services/anthropic';
import { getConversationById, updateConversation } from '@/main/db';
import { Conversation } from '@/types';
import { isAbortError } from '@/main/errors';
import { Message } from '@/types/message';

export class ChatService {
  private activeChats: Map<string, {
    abortController: AbortController;
  }>;
  private anthropicService: AnthropicService;

  constructor(llmService: AnthropicService) {
    this.activeChats = new Map();
    this.anthropicService = llmService;
  }

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
      for await (const message of this.anthropicService.sendMessage(conversation.messages, systemPrompt)) {
        this.handleNewMessage(conversationId, message);
      }

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
      if (!isAbortError(error)) {
        console.error(`Chat ${conversationId} error:`, error);
        throw error
      }
    } finally {
      console.log(`Chat ${conversationId} stopped. Cleaning up...`);
      const conversation = getConversationById(conversationId);
      if (conversation) {
        const c = {
          ...conversation,
          status: 'inactive' as const,
          updatedAt: Date.now()
        };
        updateConversation(c);
        this.broadcastUpdate(c);
      }
      this.activeChats.delete(conversationId);
      console.log(`Chat ${conversationId} cleaned up successfully`);
    }
  }

  async stopChat(conversationId: string): Promise<void> {
    const chat = this.activeChats.get(conversationId);
    if (!chat) throw new Error('Chat not found or not running');

    chat.abortController.abort();
    // the cleanup should be handled by the finally block in sendMessage
  }

  async generateTitle(conversationId: string, message: string): Promise<void> {
    const conversation = getConversationById(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    try {
      const title = await this.anthropicService.generateTitle(message);
      // fetching the conversation again in case it was updated by another process
      // TODO: use transactions
      const conversation = getConversationById(conversationId);
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

  reloadSettings(): void {
    console.info('Reloading settings');
    this.anthropicService.loadSettings();
  }

  private async handleNewMessage(conversationId: string, message: Message): Promise<void> {
    const conversation = getConversationById(conversationId);
    if (!conversation) return;

    updateConversation({
      ...conversation,
      messages: [...conversation.messages, message],
      updatedAt: Date.now()
    });

    this.broadcastMessage(conversationId, message);
  }

  private broadcastMessage(conversationId: string, message: Message): void {
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

  async stopAllChats(): Promise<void> {
    await Promise.all(
      Array.from(this.activeChats.keys()).map(conversationId =>
        this.stopChat(conversationId).catch(error => {
          console.error(`Error stopping chat ${conversationId}:`, error);
        })
      )
    );
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

  ipcMain.handle('chat:reloadSettings', async () => {
    try {
      return chatManager.reloadSettings();
    } catch (error) {
      console.error('Error reloading settings:', error);
      throw error;
    }
  });
}
