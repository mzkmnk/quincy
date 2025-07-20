/**
 * 会話履歴から最後のチャットメッセージを抽出
 */

import type { AmazonQConversationWithHistory } from '../amazon-q-history-types';

export interface LastChatMessage {
  userMessage: string;
  aiResponse: string;
  timestamp: string;
  turnId: string;
}

export function extractLastChatMessage(
  conversation: AmazonQConversationWithHistory
): LastChatMessage | null {
  // historyが存在しない、null、または空配列の場合はnullを返す
  if (
    !conversation.history ||
    !Array.isArray(conversation.history) ||
    conversation.history.length === 0
  ) {
    return null;
  }

  // 最後から有効なターンを探す
  for (let i = conversation.history.length - 1; i >= 0; i--) {
    const turn = conversation.history[i];

    // 無効なターン（null、undefined、空オブジェクト）をスキップ
    if (!turn || typeof turn !== 'object') {
      continue;
    }

    // ユーザーメッセージまたはAI応答が存在するターンを有効とみなす
    const hasUserMessage = turn.user_message && typeof turn.user_message === 'object';
    const hasAiResponse = turn.ai_response && typeof turn.ai_response === 'object';

    if (!hasUserMessage && !hasAiResponse) {
      continue;
    }

    // メッセージとタイムスタンプを安全に抽出
    const userMessage = hasUserMessage ? turn.user_message.message || '' : '';
    const aiResponse = hasAiResponse ? turn.ai_response.message || '' : '';
    const turnId = turn.turn_id || '';

    // タイムスタンプの優先順位: AI応答 > ユーザーメッセージ > 空文字
    let timestamp = '';
    if (hasAiResponse && turn.ai_response.timestamp) {
      timestamp = turn.ai_response.timestamp;
    } else if (hasUserMessage && turn.user_message.timestamp) {
      timestamp = turn.user_message.timestamp;
    }

    return {
      userMessage,
      aiResponse,
      timestamp,
      turnId,
    };
  }

  // 有効なターンが見つからない場合はnullを返す
  return null;
}
