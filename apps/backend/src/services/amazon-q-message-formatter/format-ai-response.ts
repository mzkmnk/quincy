/**
 * AI の最終回答を整形
 */

import type { ConversationTurn, DisplayMessage } from '../amazon-q-history-types';
import { generateMessageId } from '../../utils/id-generator';

export function formatAiResponse(turn: ConversationTurn): DisplayMessage {
  const lastMessageId = turn.metadata.messageIds[turn.metadata.messageIds.length - 1];

  return {
    id: generateMessageId(),
    type: 'assistant',
    content: turn.aiResponse,
    timestamp: new Date(),
    metadata: {
      environmentInfo: turn.metadata.environmentInfo,
      toolsUsed: turn.metadata.toolsUsed,
      messageId: lastMessageId,
    },
  };
}
