/**
 * 認証エラークラス
 */

import { AppError } from './app-error';

export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    details?: Record<string, string | number | boolean | null>
  ) {
    super('AUTHENTICATION_ERROR', message, 401, details);
  }
}
