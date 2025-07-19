import { Socket } from 'socket.io-client';

import { emit } from '../connection/emit';

/**
 * プロジェクト履歴の詳細を取得する
 * @param socket Socket接続
 * @param projectPath プロジェクトのパス
 */
export function getProjectHistoryDetailed(socket: Socket | null, projectPath: string): void {
  emit(socket, 'q:history:detailed', { projectPath });
}