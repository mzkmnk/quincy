import { WebSocketService } from '../../../../core/services/websocket.service';

/**
 * WebSocketのチャットリスナーをクリーンアップする
 * @param websocketService WebSocketサービス
 */
export function cleanupChatWebSocketListeners(
  websocketService: WebSocketService
): void {
  websocketService.removeChatListeners();
}