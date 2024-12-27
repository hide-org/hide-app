import { useMemo } from 'react';
import { MessageParam } from '@anthropic-ai/sdk/src/resources/messages';
import { Message } from '../types';
import { convertClaudeMessages } from '../lib/messageConverters';

export function useMessageConversion(messages: MessageParam[] | undefined): Message[] {
  return useMemo(() => {
    if (!messages) return [];
    return convertClaudeMessages(messages);
  }, [messages]);
}
