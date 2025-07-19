/**
 * メッセージID生成ユーティリティ
 */

import type { MessageId } from '../../types';

import { generateId } from './generate-id';

/**
 * メッセージ用のユニークなIDを生成する
 * 形式: msg_{timestamp}_{randomString}
 * @returns ユニークなメッセージID
 */
export function generateMessageId(): MessageId {
  return generateId('msg') as MessageId;
}
