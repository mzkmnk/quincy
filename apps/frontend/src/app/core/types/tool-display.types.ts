/**
 * ツール表示機能の型定義
 */

import { QResponseMessage } from './websocket.types';

// ツール名の型定義
export type ToolName = string;

// ツールリストの型定義
export type ToolList = ToolName[];

// ツール情報を含むQResponseMessage型
export interface QResponseMessageWithTools extends QResponseMessage {
  tools: ToolList;
  hasToolContent: boolean;
}

// 型ガード関数: ToolName
export function isValidToolName(name: unknown): name is ToolName {
  if (typeof name !== 'string') {
    return false;
  }

  // 空文字列や空白文字のみは無効
  return name.trim().length > 0;
}

// 型ガード関数: ToolList
export function isValidToolList(list: unknown): list is ToolList {
  if (!Array.isArray(list)) {
    return false;
  }

  // 配列の全ての要素が有効なToolNameかどうかチェック
  return list.every(item => isValidToolName(item));
}

// 型ガード関数: QResponseMessageWithTools
export function isQResponseMessageWithTools(
  message: unknown
): message is QResponseMessageWithTools {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  const msg = message as Record<string, unknown>;

  // 基本的なQResponseMessageの要件チェック
  if (msg.type !== 'q_response') {
    return false;
  }

  // ツール関連フィールドの存在チェック
  if (!('tools' in msg) || !('hasToolContent' in msg)) {
    return false;
  }

  // tools フィールドの型チェック
  if (!isValidToolList(msg.tools)) {
    return false;
  }

  // hasToolContent フィールドの型チェック
  if (typeof msg.hasToolContent !== 'boolean') {
    return false;
  }

  return true;
}
