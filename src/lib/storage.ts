import { Conversation } from '../types';

const CONVERSATIONS_KEY = 'hide-app-conversations';

export const saveConversations = (conversations: Conversation[]): void => {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
};

export const loadConversations = (): Conversation[] => {
  const data = localStorage.getItem(CONVERSATIONS_KEY);
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse conversations from localStorage:', error);
    return [];
  }
};

export const saveConversation = (conversation: Conversation): void => {
  const conversations = loadConversations();
  // Filter out the old version if it exists and add the new one
  const filteredConversations = conversations.filter((c) => c.id !== conversation.id);
  filteredConversations.unshift(conversation);
  
  saveConversations(filteredConversations);
};