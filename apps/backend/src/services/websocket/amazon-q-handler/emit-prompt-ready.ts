/**
 * プロンプト準備完了状態をWebSocketクライアントに通知する
 * 既存のq:infoイベントを使用してプロンプト準備完了を通知
 */

import type { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@quincy/shared';

import { emitToSession } from './emit-to-session';

export function emitPromptReady(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  sessionId: string
): void {
  emitToSession(io, sessionId, 'q:info', {
    sessionId,
    message: 'prompt-ready',
    type: 'status',
  });
}
