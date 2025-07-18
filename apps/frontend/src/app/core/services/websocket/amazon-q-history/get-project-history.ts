import { Socket } from 'socket.io-client';
import { emit } from '../connection/emit';

/**
 * プロジェクト履歴を取得する
 * @param socket Socket接続
 * @param projectPath プロジェクトのパス
 */
export function getProjectHistory(socket: Socket | null, projectPath: string): void {
  emit(socket, 'q:history', { projectPath });
}