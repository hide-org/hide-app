import { useMemo } from 'react';
import { UIMessage } from '@/types';
import { convertMessages } from '@/lib/messageConverters';
import { Message } from '@/types/message';

export function useMessageConversion(messages: Message[] | undefined): UIMessage[] {
  return useMemo(() => {
    if (!messages) return [];
    return convertMessages(messages);
  }, [messages]);
}
