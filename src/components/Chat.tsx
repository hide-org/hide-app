import { MessageParam } from '@anthropic-ai/sdk/src/resources/messages';
import { v4 as uuidv4 } from 'uuid';
import { useState, useCallback, useEffect } from 'react';
import { Conversation } from '../types';
import { ChatArea } from './ChatArea';
import { ChatHistory } from './ChatHistory';
import { initializeClaudeService, getClaudeService } from '../lib/claude';
import { getAnthropicApiKey, isApiKeyConfigured } from '../lib/config';
import { loadConversations, saveConversations } from '../lib/storage';
import { useMessageConversion } from '../hooks/useMessageConversion';

const DEFAULT_CONVERSATION_TITLE = 'Untitled Chat';

export const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
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

    const messages = [...currentConversation.messages, message];
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
      let responseMessages = messages;  // Collect all the messages from the completion

      for await (const response of claudeService.sendMessage(messages)) {
        responseMessages = [...responseMessages, response];
        updateConversation({
          ...currentConversation,
          messages: responseMessages,
          updatedAt: Date.now(),
        });
      }

      if (shouldGenerateTitle) {
        claudeService.generateTitle(currentConversation.messages[0]?.content as string || input.trim())
          .then(title => {
            updateConversation({
              ...currentConversation,
              messages: responseMessages,
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

  return (
    <div className="flex h-screen">
      <ChatHistory
        conversations={conversations}
        selectedConversation={currentConversation}
        onSelectConversation={setCurrentConversation}
        onNewChat={newConversation}
      />
      <div className="flex-1 flex flex-col">
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
          <div className="flex h-full items-center justify-center">
            <div className="text-xl">Select a conversation or start a new one</div>
          </div>
        )}
      </div>
    </div>
  );
};
