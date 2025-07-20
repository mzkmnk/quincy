/**
 * 統一エラーシステム
 * 新しい1ファイル1関数アーキテクチャによる再構築済み
 */

// 新しいエラーシステムのエクスポート
export * from './errors';
export * from './error-factory';
export {
  unifiedErrorHandler as errorHandler,
  notFoundHandler,
  createWebSocketErrorHandler,
  getErrorLevel,
  getErrorDetails,
} from './errors/unified-error-handler';

// 後方互換性のための旧形式サポート（非推奨）
import type { Request, Response } from 'express';

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  path?: string;
}

export const createErrorResponse = (
  error: string,
  message: string,
  path?: string
): ErrorResponse => ({
  error,
  message,
  timestamp: new Date().toISOString(),
  path,
});

// 旧形式のエラーハンドラー（非推奨 - 新しいunifiedErrorHandlerを使用してください）
export const legacyErrorHandler = (error: Error, req: Request, res: Response): void => {
  const response = createErrorResponse(
    'INTERNAL_SERVER_ERROR',
    error.message || 'An unexpected error occurred',
    req.url
  );

  res.status(500).json(response);
};
