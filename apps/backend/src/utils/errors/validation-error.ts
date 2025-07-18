/**
 * バリデーションエラークラス
 */

import { AppError } from './app-error';

export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    details?: Record<string, string | number | boolean | null>
  ) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}