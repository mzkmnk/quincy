import { io, Socket } from 'socket.io-client';
import { WritableSignal } from '@angular/core';

import { ConnectionState } from '../types';

/**
 * WebSocket接続を確立する
 * @param backendUrl バックエンドのURL
 * @param connectionState 接続状態のSignal
 * @returns Socket接続
 */
export function connect(
  backendUrl: string,
  connectionState: WritableSignal<ConnectionState>
): Socket {
  const socket = io(backendUrl, {
    transports: ['websocket'],
    autoConnect: true,
  });

  // 接続状態の更新
  connectionState.set({ connected: false, connecting: true, error: null });

  // イベントリスナーの設定
  socket.on('connect', () => {
    connectionState.set({ connected: true, connecting: false, error: null });
  });

  socket.on('disconnect', () => {
    connectionState.set({ connected: false, connecting: false, error: null });
  });

  socket.on('connect_error', (error: Error) => {
    connectionState.set({ 
      connected: false, 
      connecting: false, 
      error: error.message || 'Connection failed' 
    });
  });

  return socket;
}