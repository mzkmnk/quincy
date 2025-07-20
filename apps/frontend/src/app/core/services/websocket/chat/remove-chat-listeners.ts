import { Socket } from 'socket.io-client';

import { off } from '../connection/off';

/**
 * チャット関連のイベントリスナーを削除する
 * @param socket Socket接続
 */
export function removeChatListeners(socket: Socket | null): void {
  off(socket, 'q:response');
  off(socket, 'q:error');
  off(socket, 'q:info');
  off(socket, 'q:complete');
}
