import { Socket } from 'socket.io-client';
import { emit } from '../connection/emit';
import { on } from '../connection/on';

/**
 * 全プロジェクトの履歴を取得する
 * @param socket Socket接続
 * @returns Promise<void>
 */
export function getAllProjectsHistory(socket: Socket | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('WebSocket not connected'));
      return;
    }

    // タイムアウトを設定（10秒）
    const timeout = setTimeout(() => {
      reject(new Error('履歴取得がタイムアウトしました'));
    }, 10000);

    // 一時的なリスナーを設定してレスポンスを待つ
    const onSuccess = () => {
      clearTimeout(timeout);
      resolve();
    };

    const onError = (error: any) => {
      clearTimeout(timeout);
      reject(new Error(error.message || '履歴取得エラー'));
    };

    // 一回だけのリスナーを設定
    socket.once('q:history:list', onSuccess);
    socket.once('error', onError);

    // リクエストを送信
    emit(socket, 'q:projects');
  });
}