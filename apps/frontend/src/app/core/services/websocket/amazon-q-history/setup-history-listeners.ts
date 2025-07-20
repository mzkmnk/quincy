import { Socket } from 'socket.io-client';
import type { QHistoryDetailedDataResponse } from '@quincy/shared';

import { on } from '../connection/on';
import { HistoryListeners } from '../types';

/**
 * 履歴関連のイベントリスナーを設定する
 * @param socket Socket接続
 * @param listeners 履歴リスナー
 */
export function setupHistoryListeners(socket: Socket | null, listeners: HistoryListeners): void {
  on(socket, 'q:history:data', listeners.onHistoryData);
  on(socket, 'q:history:list', listeners.onHistoryList);
}

/**
 * 履歴詳細リスナーを設定する
 * @param socket Socket接続
 * @param onDetailedHistoryData 詳細履歴データハンドラー
 */
export function setupHistoryDetailedListeners(
  socket: Socket | null,
  onDetailedHistoryData: (data: QHistoryDetailedDataResponse) => void
): void {
  on(socket, 'q:history:detailed:data', onDetailedHistoryData);
}
