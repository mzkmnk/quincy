/**
 * エラークラスのエクスポート集約
 */

export { AppError, isAppError } from './app-error';
export { ValidationError } from './validation-error';
export { NotFoundError } from './not-found-error';
export { AuthenticationError } from './authentication-error';
export { ProcessError } from './process-error';
export { WebSocketError } from './websocket-error';
export { ERROR_CODES, ERROR_STATUS_CODES } from './error-codes';

// クラスをインポートしてから型ガード関数を定義
import { ValidationError } from './validation-error';
import { NotFoundError } from './not-found-error';
import { AuthenticationError } from './authentication-error';
import { ProcessError } from './process-error';
import { WebSocketError } from './websocket-error';

// 型ガード関数
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isProcessError(error: unknown): error is ProcessError {
  return error instanceof ProcessError;
}

export function isWebSocketError(error: unknown): error is WebSocketError {
  return error instanceof WebSocketError;
}
