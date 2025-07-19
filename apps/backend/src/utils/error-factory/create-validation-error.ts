/**
 * バリデーションエラー作成ファクトリー
 */

import { ValidationError } from '../errors/validation-error';

export function createValidationError(
  message: string = 'Validation failed',
  details?: Record<string, string | number | boolean | null>
): ValidationError {
  return new ValidationError(message, details);
}

export function createFieldValidationError(
  fieldName: string,
  expectedType?: string,
  actualValue?: unknown
): ValidationError {
  const details: Record<string, string | number | boolean | null> = {
    field: fieldName,
  };

  if (expectedType) {
    details.expectedType = expectedType;
  }

  if (actualValue !== undefined) {
    details.actualValue = String(actualValue);
  }

  return new ValidationError(`Validation failed for field '${fieldName}'`, details);
}
