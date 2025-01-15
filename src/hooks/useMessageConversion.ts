import { useMemo } from 'react';
import { Message } from '../types';
import { convertClaudeMessages } from '../lib/messageConverters';
import { CoreMessage } from 'ai';

export function useMessageConversion(messages: CoreMessage[] | undefined): Message[] {
  return useMemo(() => {
    if (!messages) return [];
    return convertClaudeMessages(messages);
  }, [messages]);
}
