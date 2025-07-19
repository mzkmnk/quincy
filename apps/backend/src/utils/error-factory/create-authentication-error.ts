/**
 * 認証エラー作成ファクトリー
 */

import { AuthenticationError } from '../errors/authentication-error';

export function createAuthenticationError(
  message: string = 'Authentication failed',
  details?: Record<string, string | number | boolean | null>
): AuthenticationError {
  return new AuthenticationError(message, details);
}

export function createTokenValidationError(): AuthenticationError {
  return new AuthenticationError('Invalid or expired authentication token', {
    reason: 'token_invalid',
  });
}

export function createMissingCredentialsError(): AuthenticationError {
  return new AuthenticationError('Authentication credentials are required', {
    reason: 'credentials_missing',
  });
}
