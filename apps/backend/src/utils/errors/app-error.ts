/**
 * アプリケーション基底エラークラス
 */

import type { ErrorCode } from '../../types';

export abstract class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, string | number | boolean | null>;
  public readonly timestamp: number;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, string | number | boolean | null>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = Date.now();

    // Error.captureStackTrace が存在する場合のみ使用（Node.js環境）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * エラーのJSON表現を取得
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * クライアント向けのエラーレスポンスを取得
   */
  toClientResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details
      },
      timestamp: this.timestamp
    };
  }
}

/**
 * AppError型ガード関数
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}