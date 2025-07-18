/**
 * ユーザーメッセージを整形
 */

import type { ConversationTurn, DisplayMessage } from '../amazon-q-history-types';
import { generateMessageId } from '../../utils/id-generator';

export function formatUserMessage(turn: ConversationTurn): DisplayMessage {
  return {
    id: generateMessageId(),
    type: 'user',
    content: turn.userMessage,
    timestamp: new Date(),
    metadata: {
      environmentInfo: turn.metadata.environmentInfo
    }
  };
}