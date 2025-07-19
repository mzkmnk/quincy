import { Socket } from 'socket.io-client';
import type { QProjectStartEvent } from '@quincy/shared';

import { emit } from '../connection/emit';

/**
 * プロジェクトセッションを開始する
 * @param socket Socket接続
 * @param projectPath プロジェクトパス
 * @param resume 再開するかどうか
 */
export function startProjectSession(
  socket: Socket | null,
  projectPath: string,
  resume?: boolean
): void {
  const data: QProjectStartEvent = { projectPath, resume };
  emit(socket, 'q:project:start', data);
}
