/**
 * ConversationTurnをDisplayMessage配列に変換
 */

import type { ConversationTurn, DisplayMessage } from '../amazon-q-history-types';
import { generateMessageId } from '../../utils/id-generator';

import { formatAiResponse } from './format-ai-response';
import { formatThinkingMessages } from './format-thinking-messages';
import { formatUserMessage } from './format-user-message';

export function convertToDisplayMessages(turns: ConversationTurn[]): DisplayMessage[] {
  const displayMessages: DisplayMessage[] = [];

  for (const turn of turns) {
    try {
      // ユーザーメッセージを追加
      const userMessage = formatUserMessage(turn);
      displayMessages.push(userMessage);

      // AI の思考過程を追加（ToolUse の連続）
      const thinkingMessages = formatThinkingMessages(turn);
      displayMessages.push(...thinkingMessages);

      // AI の最終回答を追加
      const aiResponse = formatAiResponse(turn);
      displayMessages.push(aiResponse);
    } catch {
      // エラーが発生した場合もエラーメッセージを表示
      displayMessages.push({
        id: generateMessageId(),
        type: 'assistant',
        content: 'メッセージの表示中にエラーが発生しました',
        timestamp: new Date(),
      });
    }
  }

  return displayMessages;
}
