/**
 * セッションID生成ユーティリティ
 */

import type { SessionId } from '../../types';

import { generateId } from './generate-id';

/**
 * Amazon Q CLIセッション用のユニークなIDを生成する
 * 形式: q_session_{timestamp}_{randomString}
 * @returns ユニークなセッションID
 */
export function generateSessionId(): SessionId {
  return generateId('q_session') as SessionId;
}
