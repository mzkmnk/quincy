/**
 * WebSocketエラー作成ファクトリー
 */

import { WebSocketError } from '../errors/websocket-error';

export function createWebSocketError(
  message: string = 'WebSocket operation failed',
  details?: Record<string, string | number | boolean | null>
): WebSocketError {
  return new WebSocketError(message, details);
}

export function createSocketConnectionError(socketId: string): WebSocketError {
  return new WebSocketError(
    `Socket connection failed for ID: ${socketId}`,
    { socketId }
  );
}

export function createRoomOperationError(
  operation: string,
  roomId: string,
  socketId?: string
): WebSocketError {
  const details: Record<string, string | number | boolean | null> = {
    operation,
    roomId
  };
  
  if (socketId) {
    details.socketId = socketId;
  }
  
  return new WebSocketError(
    `Room ${operation} failed for room: ${roomId}`,
    details
  );
}