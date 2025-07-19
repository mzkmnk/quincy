/**
 * Not Foundエラー作成ファクトリー
 */

import { NotFoundError } from '../errors/not-found-error';

export function createNotFoundError(
  message: string = 'Resource not found',
  details?: Record<string, string | number | boolean | null>
): NotFoundError {
  return new NotFoundError(message, details);
}

export function createResourceNotFoundError(
  resourceType: string,
  resourceId: string
): NotFoundError {
  return new NotFoundError(`${resourceType} with ID '${resourceId}' was not found`, {
    resourceType,
    resourceId,
  });
}

export function createPathNotFoundError(path: string): NotFoundError {
  return new NotFoundError(`The requested path '${path}' was not found`, { path });
}
