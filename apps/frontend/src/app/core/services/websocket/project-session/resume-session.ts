import { Socket } from 'socket.io-client';
import { emit } from '../connection/emit';

/**
 * セッションを再開する
 * @param socket Socket接続
 * @param projectPath プロジェクトパス
 * @param conversationId 会話ID（オプション）
 */
export function resumeSession(
  socket: Socket | null,
  projectPath: string,
  conversationId?: string
): void {
  emit(socket, 'q:resume', { projectPath, conversationId });
}