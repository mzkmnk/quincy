import { access, stat } from 'fs/promises';
import { resolve, normalize, isAbsolute } from 'path';
import type { PathValidationResult } from './types';

/**
 * プロジェクトパスの検証
 */
export async function validateProjectPath(projectPath: string): Promise<PathValidationResult> {
  try {
    console.log(`🔍 Validating project path: ${projectPath}`);

    // 基本的なバリデーション
    if (!projectPath || typeof projectPath !== 'string') {
      return { valid: false, error: 'Project path is required and must be a string' };
    }

    const trimmedPath = projectPath.trim();
    if (!trimmedPath) {
      return { valid: false, error: 'Project path cannot be empty' };
    }

    // 絶対パスチェック
    if (!isAbsolute(trimmedPath)) {
      return { valid: false, error: 'Project path must be an absolute path' };
    }

    // パスの正規化（../ などの解決）
    const normalizedPath = normalize(resolve(trimmedPath));
    console.log(`📍 Normalized path: ${normalizedPath}`);

    // セキュリティチェック：危険なパス
    const dangerousPaths = [
      '/',
      '/etc',
      '/bin',
      '/usr/bin',
      '/sbin',
      '/usr/sbin',
      '/var',
      '/tmp',
      '/System',
      '/Applications'
    ];

    if (dangerousPaths.some(dangerous => normalizedPath === dangerous || normalizedPath.startsWith(dangerous + '/'))) {
      return { valid: false, error: 'Access to system directories is not allowed for security reasons' };
    }

    // パストラバーサル攻撃チェック
    if (normalizedPath.includes('..') || normalizedPath !== trimmedPath.replace(/\/+/g, '/')) {
      return { valid: false, error: 'Invalid path: path traversal detected' };
    }

    // ディレクトリの存在確認
    try {
      await access(normalizedPath);
      const stats = await stat(normalizedPath);
      
      if (!stats.isDirectory()) {
        return { valid: false, error: 'Path exists but is not a directory' };
      }

      console.log(`✅ Path validation successful: ${normalizedPath}`);
      return { valid: true, normalizedPath };

    } catch (accessError) {
      console.log(`❌ Path does not exist or is not accessible: ${normalizedPath}`);
      return { valid: false, error: `Directory does not exist or is not accessible: ${normalizedPath}` };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Path validation error:`, error);
    return { valid: false, error: `Path validation failed: ${errorMessage}` };
  }
}