import type { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@quincy/shared';

import type { AmazonQCLIService } from '../../amazon-q-cli';

import { emitToSession } from './emit-to-session';
import { cleanupSession } from './cleanup-session';

export function setupQCLIEventHandlers(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  qCliService: AmazonQCLIService
): void {
  // SQLite3変更検知アーキテクチャに最適化されたイベントハンドラー
  // リアルタイムレスポンスは無効化、必要最小限のイベントのみ処理

  // プロセスエラーイベント（必須：プロセス起動失敗などの通知）
  qCliService.on('q:error', data => {
    emitToSession(io, data.sessionId, 'q:error', data);
  });

  // プロセス完了イベント（必須：セッション終了通知）
  qCliService.on('q:complete', data => {
    emitToSession(io, data.sessionId, 'q:complete', data);
    cleanupSession(data.sessionId);
  });

  // セッション中止イベント（必須：強制終了通知）
  qCliService.on('session:aborted', data => {
    emitToSession(io, data.sessionId, 'q:complete', {
      sessionId: data.sessionId,
      exitCode: data.exitCode || 0,
    });
    cleanupSession(data.sessionId);
  });

  // レガシーイベント（SQLite3変更検知により無効化）
  // q:response -> SQLite3からのデータ取得に置き換え
  // q:info -> 初期化情報は不要（SQLite3で会話履歴取得）
}
