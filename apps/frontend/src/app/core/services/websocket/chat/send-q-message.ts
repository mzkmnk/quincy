import { Socket } from 'socket.io-client';

import { emit } from '../connection/emit';

/**
 * Amazon Qにメッセージを送信する
 * @param socket Socket接続
 * @param sessionId セッションID
 * @param message メッセージ内容
 * @returns Promise<void>
 */
export function sendQMessage(
  socket: Socket | null,
  sessionId: string,
  message: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('WebSocket not connected'));
      return;
    }

    // Send message to Amazon Q CLI session
    emit(socket, 'q:message', {
      sessionId,
      message,
    });

    // Resolve immediately since this is fire-and-forget
    // The response will come through q:response event
    resolve();
  });
}
