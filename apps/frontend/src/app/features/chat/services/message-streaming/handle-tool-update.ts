/**
 * ストリーミング中のツール情報リアルタイム更新処理
 */

import type { QResponseEvent } from '@quincy/shared';

import { chatStore } from '../../../../core/store/chat/actions';
import type { MessageId } from '../../../../core/types/common.types';

/**
 * ツール更新イベント
 */
export interface ToolUpdateEvent {
  messageId: MessageId;
  newTools: string[];
  timestamp: number;
  isComplete: boolean;
}

/**
 * ストリーミング中のツール更新を処理する
 *
 * @param responseEvent Amazon Qからのレスポンスイベント
 * @param currentMessageId 現在のストリーミングメッセージID
 * @returns ツール更新イベント（更新があった場合）
 */
export function handleToolUpdate(
  responseEvent: QResponseEvent,
  currentMessageId?: MessageId
): ToolUpdateEvent | null {
  // ツール情報が含まれていない場合は何もしない
  if (!responseEvent.tools || responseEvent.tools.length === 0) {
    return null;
  }

  // メッセージIDが指定されていない場合は何もしない
  if (!currentMessageId) {
    return null;
  }

  // 現在のメッセージを取得
  const currentMessage = chatStore.getMessageById(currentMessageId);
  if (!currentMessage) {
    return null;
  }

  // 既存ツールと新しいツールを比較
  const existingTools = currentMessage.tools || [];
  const newTools = responseEvent.tools;

  // 新しいツールがあるかチェック
  const hasNewTools = newTools.some(tool => !existingTools.includes(tool));

  if (!hasNewTools) {
    return null; // 新しいツールがない場合は更新不要
  }

  // ツール情報を結合（重複除去）
  const combinedTools = Array.from(new Set([...existingTools, ...newTools]));

  // メッセージのツール情報を更新
  chatStore.updateMessage(currentMessageId, {
    tools: combinedTools,
    hasToolContent: combinedTools.length > 0,
    lastUpdated: Date.now(),
  });

  return {
    messageId: currentMessageId,
    newTools: newTools.filter(tool => !existingTools.includes(tool)),
    timestamp: Date.now(),
    isComplete: responseEvent.type === 'complete',
  };
}

/**
 * ツール更新の統計情報を取得
 *
 * @param messageId メッセージID
 * @returns 統計情報
 */
export function getToolUpdateStats(messageId: MessageId): {
  totalTools: number;
  uniqueTools: number;
  lastUpdated: number;
  updateCount: number;
} | null {
  const message = chatStore.getMessageById(messageId);
  if (!message) {
    return null;
  }

  const tools = message.tools || [];

  return {
    totalTools: tools.length,
    uniqueTools: new Set(tools).size,
    lastUpdated: message.lastUpdated || 0,
    updateCount: message.toolUpdateCount || 0,
  };
}

/**
 * ツール更新履歴をクリア
 *
 * @param messageId メッセージID
 */
export function clearToolUpdateHistory(messageId: MessageId): void {
  chatStore.updateMessage(messageId, {
    toolUpdateCount: 0,
    lastUpdated: Date.now(),
  });
}

/**
 * ツール更新の頻度制限（デバウンス）
 */
const toolUpdateDebounce = new Map<MessageId, number>();

/**
 * デバウンスされたツール更新処理
 *
 * @param responseEvent Amazon Qからのレスポンスイベント
 * @param currentMessageId 現在のストリーミングメッセージID
 * @param debounceMs デバウンス時間（ms、デフォルト100ms）
 * @returns ツール更新イベント（更新があった場合）
 */
export function handleToolUpdateDebounced(
  responseEvent: QResponseEvent,
  currentMessageId?: MessageId,
  debounceMs: number = 100
): ToolUpdateEvent | null {
  if (!currentMessageId) {
    return null;
  }

  // 前回の更新からの時間をチェック
  const lastUpdate = toolUpdateDebounce.get(currentMessageId) || 0;
  const now = Date.now();

  if (now - lastUpdate < debounceMs) {
    return null; // デバウンス中は更新しない
  }

  // 更新時間を記録
  toolUpdateDebounce.set(currentMessageId, now);

  // 通常のツール更新処理を実行
  const result = handleToolUpdate(responseEvent, currentMessageId);

  // 更新カウントを増加
  if (result) {
    const message = chatStore.getMessageById(currentMessageId);
    if (message) {
      chatStore.updateMessage(currentMessageId, {
        toolUpdateCount: (message.toolUpdateCount || 0) + 1,
      });
    }
  }

  return result;
}

/**
 * デバウンステーブルをクリア
 */
export function clearToolUpdateDebounce(): void {
  toolUpdateDebounce.clear();
}
