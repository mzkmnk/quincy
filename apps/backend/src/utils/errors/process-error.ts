/**
 * プロセスエラークラス
 */

import { AppError } from './app-error';

export class ProcessError extends AppError {
  constructor(
    message: string = 'Process operation failed',
    details?: Record<string, string | number | boolean | null>
  ) {
    super('PROCESS_ERROR', message, 500, details);
  }
}
