import type { Server as SocketIOServer } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData
} from '@quincy/shared';
import type { AmazonQCLIService } from '../../amazon-q-cli';
import { emitToSession } from './emit-to-session';
import { cleanupSession } from './cleanup-session';

export function setupQCLIEventHandlers(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  qCliService: AmazonQCLIService
): void {
  // Amazon Q CLIサービスからのイベントをWebSocketクライアントに転送
  qCliService.on('q:response', (data) => {
    // セッションに紐付いたソケットのみに配信
    emitToSession(io, data.sessionId, 'q:response', data);
  });

  qCliService.on('q:error', (data) => {
    // セッションに紐付いたソケットのみに配信
    emitToSession(io, data.sessionId, 'q:error', data);
  });

  qCliService.on('q:info', (data) => {
    // セッションに紐付いたソケットのみに配信
    emitToSession(io, data.sessionId, 'q:info', data);
  });

  qCliService.on('q:complete', (data) => {
    // セッションに紐付いたソケットのみに配信
    emitToSession(io, data.sessionId, 'q:complete', data);
    // セッション終了時にマッピングをクリーンアップ
    cleanupSession(data.sessionId);
  });

  qCliService.on('session:aborted', (data) => {
    emitToSession(io, data.sessionId, 'q:complete', {
      sessionId: data.sessionId,
      exitCode: data.exitCode || 0
    });
    // セッション終了時にマッピングをクリーンアップ
    cleanupSession(data.sessionId);
  });
}