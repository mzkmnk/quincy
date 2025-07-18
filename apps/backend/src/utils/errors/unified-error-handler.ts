/**
 * 統一エラーハンドラー
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError, isAppError } from './app-error';
import { ERROR_CODES, ERROR_STATUS_CODES } from './error-codes';
import type { ApiResponse } from '../../types';

/**
 * Express用の統一エラーハンドリングミドルウェア
 */
export function unifiedErrorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // AppErrorの場合
  if (isAppError(error)) {
    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      timestamp: error.timestamp
    };
    
    res.status(error.statusCode).json(errorResponse);
    return;
  }
  
  // 一般的なErrorの場合
  const errorResponse: ApiResponse = {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error.message || 'An unexpected error occurred',
      details: {
        path: req.url,
        method: req.method
      }
    },
    timestamp: Date.now()
  };
  
  res.status(ERROR_STATUS_CODES[ERROR_CODES.INTERNAL_ERROR]).json(errorResponse);
}

/**
 * 404エラー用のハンドラー
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: ApiResponse = {
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: 'The requested resource was not found',
      details: {
        path: req.url,
        method: req.method
      }
    },
    timestamp: Date.now()
  };
  
  res.status(ERROR_STATUS_CODES[ERROR_CODES.NOT_FOUND]).json(errorResponse);
}

/**
 * WebSocket用のエラーハンドラー
 */
export function createWebSocketErrorHandler() {
  return function handleWebSocketError(
    error: Error | AppError,
    emitError: (errorData: any) => void
  ): void {
    if (isAppError(error)) {
      emitError(error.toClientResponse());
      return;
    }
    
    // 一般的なErrorの場合
    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message || 'An unexpected WebSocket error occurred'
      },
      timestamp: Date.now()
    };
    
    emitError(errorResponse);
  };
}

/**
 * エラーのレベルを判定（ロギング用）
 */
export function getErrorLevel(error: Error | AppError): 'error' | 'warn' | 'info' {
  if (isAppError(error)) {
    // 4xx系は警告レベル
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return 'warn';
    }
    // 5xx系はエラーレベル
    if (error.statusCode >= 500) {
      return 'error';
    }
  }
  
  // 一般的なエラーはエラーレベル
  return 'error';
}

/**
 * エラーの詳細情報を安全に取得
 */
export function getErrorDetails(error: Error | AppError): {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
} {
  const baseDetails = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
  
  if (isAppError(error)) {
    return {
      ...baseDetails,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details
    };
  }
  
  return baseDetails;
}