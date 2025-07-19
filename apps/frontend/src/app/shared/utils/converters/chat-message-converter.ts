import type { DisplayMessage } from '@quincy/shared';

import type { ChatMessage } from '../../../core/store/app.state';

import { convertDisplayMessageToChatMessage } from './display-message-converter';

/**
 * DisplayMessageの配列をChatMessageの配列に変換する
 * @param displayMessages 変換元のDisplayMessage配列
 * @returns 変換されたChatMessage配列
 */
export function convertDisplayMessagesToChatMessages(
  displayMessages: DisplayMessage[]
): ChatMessage[] {
  return displayMessages.map(convertDisplayMessageToChatMessage);
}
