import { Socket } from 'socket.io-client';
import { off } from '../connection/off';

/**
 * プロジェクトセッションのイベントリスナーを削除する
 * @param socket Socket接続
 */
export function removeProjectSessionListeners(socket: Socket | null): void {
  off(socket, 'q:session:started');
}