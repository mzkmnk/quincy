import { Socket } from 'socket.io-client';
import { WritableSignal } from '@angular/core';

import { ConnectionState } from '../types';

/**
 * WebSocket接続を切断する
 * @param socket Socket接続
 * @param connectionState 接続状態のSignal
 */
export function disconnect(
  socket: Socket | null,
  connectionState: WritableSignal<ConnectionState>
): void {
  if (socket) {
    socket.disconnect();
  }
  connectionState.set({ connected: false, connecting: false, error: null });
}