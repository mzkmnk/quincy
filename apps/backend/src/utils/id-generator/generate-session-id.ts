/**
 * セッションID生成ユーティリティ
 */

import { generateId } from './generate-id';

/**
 * Amazon Q CLIセッション用のユニークなIDを生成する
 * 形式: q_session_{timestamp}_{randomString}
 * @returns ユニークなセッションID
 */
export function generateSessionId(): string {
  return generateId('q_session');
}