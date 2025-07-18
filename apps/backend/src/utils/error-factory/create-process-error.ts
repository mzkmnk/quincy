/**
 * プロセスエラー作成ファクトリー
 */

import { ProcessError } from '../errors/process-error';

export function createProcessError(
  message: string = 'Process operation failed',
  details?: Record<string, string | number | boolean | null>
): ProcessError {
  return new ProcessError(message, details);
}

export function createProcessSpawnError(
  command: string,
  exitCode?: number
): ProcessError {
  const details: Record<string, string | number | boolean | null> = {
    command
  };
  
  if (exitCode !== undefined) {
    details.exitCode = exitCode;
  }
  
  return new ProcessError(
    `Failed to spawn process: ${command}`,
    details
  );
}

export function createProcessTimeoutError(
  command: string,
  timeout: number
): ProcessError {
  return new ProcessError(
    `Process timed out after ${timeout}ms: ${command}`,
    {
      command,
      timeout
    }
  );
}