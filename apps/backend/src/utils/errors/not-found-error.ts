/**
 * Not Foundエラークラス
 */

import { AppError } from './app-error';

export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    details?: Record<string, string | number | boolean | null>
  ) {
    super('NOT_FOUND', message, 404, details);
  }
}
