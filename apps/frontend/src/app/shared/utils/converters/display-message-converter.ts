import type { DisplayMessage } from '@quincy/shared';

import type { ChatMessage } from '../../../core/store/app.state';

/**
 * DisplayMessageをChatMessageに変換する
 * @param displayMessage 変換元のDisplayMessage
 * @returns 変換されたChatMessage
 */
export function convertDisplayMessageToChatMessage(displayMessage: DisplayMessage): ChatMessage {
  return {
    id: displayMessage.id,
    content: displayMessage.content,
    sender: displayMessage.type === 'user' ? 'user' as const : 'assistant' as const,
    timestamp: displayMessage.timestamp ? new Date(displayMessage.timestamp) : new Date(),
    isTyping: displayMessage.type === 'thinking' ? true : false
  };
}