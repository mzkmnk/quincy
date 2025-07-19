/**
 * 複数のHistoryEntryから1つのConversationTurnを作成
 */

import type { ConversationTurn, HistoryEntry } from '../amazon-q-history-types';

import { extractUserMessage } from './extract-user-message';
import { extractAiThinking } from './extract-ai-thinking';
import { extractAiResponse } from './extract-ai-response';
import { extractMetadata } from './extract-metadata';

export function createConversationTurn(
  entries: HistoryEntry[], 
  startIndex: number, 
  endIndex: number
): ConversationTurn {
  const userMessage = extractUserMessage(entries);
  const aiThinking = extractAiThinking(entries);
  const aiResponse = extractAiResponse(entries);
  const metadata = extractMetadata(entries, startIndex, endIndex);
  
  return {
    userMessage,
    aiThinking,
    aiResponse,
    metadata
  };
}