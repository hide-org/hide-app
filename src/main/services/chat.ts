import { CoreMessage } from 'ai';
import { BrowserWindow, ipcMain } from 'electron';
import { LLMService } from '@/main/llm';
import { getConversationById, updateConversation } from '@/main/db';

export class ChatService {
  private activeChats: Map<string, {
    abortController: AbortController;
    // status: ConversationStatus;
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
      // status: 'running'
    });

    // await this.updateChatStatus(conversationId, 'running');

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
        // TODO: update sendMessage to accept AbortSignal
        // abortController.signal
      );

      // await this.updateChatStatus(conversationId, 'completed');
    } catch (error) {
      // TODO: read about AbortError (or AbortController in general)
      // if (error instanceof AbortError) {
      //   await this.updateChatStatus(conversationId, 'paused');
      // } else {
      //   console.error(`Chat ${conversationId} error:`, error);
      //   await this.updateChatStatus(conversationId, 'idle');
      // }
      console.error(`Chat ${conversationId} error:`, error);
    } finally {
      this.activeChats.delete(conversationId);
    }
  }

  async stopChat(conversationId: string): Promise<void> {
    const chat = this.activeChats.get(conversationId);
    if (!chat) throw new Error('Chat not found or not running');

    chat.abortController.abort();
    this.activeChats.delete(conversationId);
    // await this.updateChatStatus(conversationId, 'paused');
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
}
