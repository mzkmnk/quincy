/**
 * WebSocketエラークラス
 */

import { AppError } from './app-error';

export class WebSocketError extends AppError {
  constructor(
    message: string = 'WebSocket operation failed',
    details?: Record<string, string | number | boolean | null>
  ) {
    super('WEBSOCKET_ERROR', message, 500, details);
  }
}
