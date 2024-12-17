export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}