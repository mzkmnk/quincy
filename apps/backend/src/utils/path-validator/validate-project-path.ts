/**
 * プロジェクトパス検証メイン関数
 */

import { access, stat } from 'fs/promises';

import { isValidPath, isDangerousPath } from './is-valid-path';
import { normalizePath } from './normalize-path';
import { checkPathTraversal } from './check-path-traversal';

export interface PathValidationResult {
  valid: boolean;
  error?: string;
  normalizedPath?: string;
}

/**
 * プロジェクトパスの包括的な検証を行う
 * @param projectPath 検証対象のプロジェクトパス
 * @returns 検証結果
 */
export async function validateProjectPath(projectPath: string): Promise<PathValidationResult> {
  try {
    // 基本的なバリデーション
    const basicValidation = isValidPath(projectPath);
    if (!basicValidation.valid) {
      return basicValidation;
    }

    const trimmedPath = projectPath.trim();
    
    // パスの正規化（../ などの解決）
    const normalizedPath = normalizePath(trimmedPath);

    // セキュリティチェック：危険なパス
    if (isDangerousPath(normalizedPath)) {
      return { 
        valid: false, 
        error: 'Access to system directories is not allowed for security reasons' 
      };
    }

    // パストラバーサル攻撃チェック
    if (checkPathTraversal(normalizedPath, trimmedPath)) {
      return { 
        valid: false, 
        error: 'Invalid path: path traversal detected' 
      };
    }

    // ディレクトリの存在確認
    try {
      await access(normalizedPath);
      const stats = await stat(normalizedPath);
      
      if (!stats.isDirectory()) {
        return { 
          valid: false, 
          error: 'Path exists but is not a directory' 
        };
      }

      return { valid: true, normalizedPath };

    } catch (accessError) {
      return { 
        valid: false, 
        error: `Directory does not exist or is not accessible: ${normalizedPath}` 
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      valid: false, 
      error: `Path validation failed: ${errorMessage}` 
    };
  }
}