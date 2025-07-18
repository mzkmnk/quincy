import { Socket } from 'socket.io-client';
import { off } from '../connection/off';

/**
 * 履歴関連のイベントリスナーを削除する
 * @param socket Socket接続
 */
export function removeHistoryListeners(socket: Socket | null): void {
  off(socket, 'q:history:data');
  off(socket, 'q:history:list');
}

/**
 * 履歴詳細リスナーを削除する
 * @param socket Socket接続
 */
export function removeHistoryDetailedListeners(socket: Socket | null): void {
  off(socket, 'q:history:detailed:data');
}