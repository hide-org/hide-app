import { useState, useCallback, useEffect } from 'react';
import { Message, Conversation } from '../types';
import { ChatArea } from './ChatArea';
import { ChatHistory } from './ChatHistory';
import { Details } from './Details';
import { initializeClaudeService, getClaudeService } from '../lib/claude';
import { getAnthropicApiKey, isApiKeyConfigured } from '../lib/config';
import { loadConversations, saveConversation } from '../lib/storage';

export const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
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

  // Load selected conversation messages
  useEffect(() => {
    if (selectedConversation === null) {
      setMessages([]);
    } else {
      const conversation = conversations.find((c) => c.id === selectedConversation);
      if (conversation) {
        setMessages(conversation.messages);
      }
    }
  }, [selectedConversation, conversations]);

  const handleNewChat = useCallback(() => {
    setSelectedConversation(null);
    setMessages([]);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const claudeService = getClaudeService();
      const messagesForClaude = [...messages, userMessage];
      const response = await claudeService.sendMessage(messagesForClaude);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };

      const updatedMessages = [...messagesForClaude, assistantMessage];
      setMessages(updatedMessages);
      setError(null); // Clear any previous errors

      // Save conversation
      const timestamp = Date.now();
      const conversation: Conversation = {
        id: selectedConversation || timestamp.toString(),
        messages: updatedMessages,
        createdAt: selectedConversation ? conversations.find(c => c.id === selectedConversation)?.createdAt || timestamp : timestamp,
        updatedAt: timestamp,
      };
      
      if (!selectedConversation) {
        setSelectedConversation(conversation.id);
        setConversations(prev => [conversation, ...prev]);
      } else {
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation ? conversation : conv
        ));
      }
      saveConversation(conversation);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  return (
    <div className="flex h-screen">
      <ChatHistory
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
        onNewChat={handleNewChat}
      />
      <div className="flex-1 flex flex-col">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <ChatArea
          messages={messages}
          input={input}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
      </div>
      <Details />
    </div>
  );
};