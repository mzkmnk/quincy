/**
 * メッセージID生成ユーティリティ
 */

import { generateId } from './generate-id';

/**
 * メッセージ用のユニークなIDを生成する
 * 形式: msg_{timestamp}_{randomString}
 * @returns ユニークなメッセージID
 */
export function generateMessageId(): string {
  return generateId('msg');
}