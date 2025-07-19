import { Socket } from 'socket.io-client';

import { emit } from '../connection/emit';

/**
 * Amazon Qセッションを中止する
 * @param socket Socket接続
 * @param sessionId セッションID
 */
export function abortQSession(socket: Socket | null, sessionId: string): void {
  emit(socket, 'q:abort', { sessionId });
}
