import { WebSocketService } from '../../../../core/services/websocket.service';

export interface ChatWebSocketHandlers {
  onQResponse: (data: { sessionId: string; data: string }) => void;
  onQError: (data: { sessionId: string; error: string }) => void;
  onQInfo: (data: { sessionId: string; message: string; type?: string }) => void;
  onQCompletion: (data: { sessionId: string }) => void;
}

/**
 * WebSocketのチャットリスナーを設定する
 * @param websocketService WebSocketサービス
 * @param handlers イベントハンドラー
 */
export function setupChatWebSocketListeners(
  websocketService: WebSocketService,
  handlers: ChatWebSocketHandlers
): void {
  // Setup chat listeners for real-time message handling
  websocketService.setupChatListeners(
    handlers.onQResponse,
    handlers.onQError,
    handlers.onQInfo,
    handlers.onQCompletion
  );
}