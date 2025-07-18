import { Socket } from 'socket.io-client';
import { on } from '../connection/on';
import { Observable } from 'rxjs';
import type { QSessionStartedEvent } from '@quincy/shared';

/**
 * プロジェクトセッションのイベントリスナーを設定する
 * @param socket Socket接続
 * @param onSessionStarted セッション開始時のコールバック
 */
export function setupProjectSessionListeners(
  socket: Socket | null,
  onSessionStarted: (data: QSessionStartedEvent) => void
): void {
  on(socket, 'q:session:started', onSessionStarted);
}

/**
 * セッション失敗イベントのObservableを作成する
 * @param socket Socket接続
 * @returns セッション失敗イベントのObservable
 */
export function createSessionFailedObservable(socket: Socket | null): Observable<{ error: string }> {
  return new Observable((subscriber) => {
    const handler = (data: { error: string }) => {
      subscriber.next(data);
    };
    
    on(socket, 'q:session:failed', handler);
    
    return () => {
      if (socket) {
        socket.off('q:session:failed', handler);
      }
    };
  });
}