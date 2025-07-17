/**
 * パス検証ユーティリティのテスト
 */

import { 
  validateProjectPath,
  isValidPath,
  isDangerousPath,
  getDangerousPaths,
  checkPathTraversal,
  normalizePath,
  DANGEROUS_PATHS
} from '../utils/path-validator';
import { mkdtemp, rmdir } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

describe('パス検証ユーティリティ', () => {
  let tempDir: string;

  beforeAll(async () => {
    // ホームディレクトリに一時ディレクトリを作成（/varを避ける）
    tempDir = await mkdtemp(join(homedir(), 'path-validator-test-'));
  });

  afterAll(async () => {
    try {
      await rmdir(tempDir);
    } catch (error) {
      // テンポラリディレクトリの削除に失敗してもテストは継続
    }
  });

  describe('isValidPath', () => {
    it('有効な絶対パスを正しく検証する', () => {
      const result = isValidPath('/home/user/project');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('空文字列を拒否する', () => {
      const result = isValidPath('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Project path is required and must be a string');
    });

    it('null/undefinedを拒否する', () => {
      const result1 = isValidPath(null as any);
      const result2 = isValidPath(undefined as any);
      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);
    });

    it('相対パスを拒否する', () => {
      const result = isValidPath('./relative/path');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('absolute path');
    });

    it('空白のみのパスを拒否する', () => {
      const result = isValidPath('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });
  });

  describe('isDangerousPath', () => {
    it('危険なシステムディレクトリを検出する', () => {
      expect(isDangerousPath('/')).toBe(true);
      expect(isDangerousPath('/etc')).toBe(true);
      expect(isDangerousPath('/bin')).toBe(true);
      expect(isDangerousPath('/etc/config')).toBe(true);
    });

    it('安全なパスを許可する', () => {
      expect(isDangerousPath('/home/user/project')).toBe(false);
      expect(isDangerousPath('/Users/developer/workspace')).toBe(false);
    });
  });

  describe('getDangerousPaths', () => {
    it('危険なパスのリストを返す', () => {
      const paths = getDangerousPaths();
      expect(paths).toContain('/');
      expect(paths).toContain('/etc');
      expect(paths).toContain('/bin');
      expect(Array.isArray(paths)).toBe(true);
    });

    it('DANGEROUS_PATHS定数と一致する', () => {
      const paths = getDangerousPaths();
      expect(paths).toEqual(DANGEROUS_PATHS);
    });
  });

  describe('checkPathTraversal', () => {
    it('パストラバーサル攻撃を検出する', () => {
      expect(checkPathTraversal('/home/../etc', '/home/../etc')).toBe(true);
      expect(checkPathTraversal('/home/user/../../../etc', '/home/user/../../../etc')).toBe(true);
    });

    it('正常なパスを許可する', () => {
      expect(checkPathTraversal('/home/user/project', '/home/user/project')).toBe(false);
    });

    it('正常なパスは検出されない', () => {
      expect(checkPathTraversal('/home/user', '/home/user')).toBe(false);
    });
  });

  describe('normalizePath', () => {
    it('パスを正規化する', () => {
      const result = normalizePath('/home/user/../user/project');
      expect(result).toBe('/home/user/project');
    });

    it('相対パス要素を解決する', () => {
      const result = normalizePath('/home/./user/./project');
      expect(result).toBe('/home/user/project');
    });
  });

  describe('validateProjectPath', () => {
    it('存在する有効なディレクトリを検証する', async () => {
      const result = await validateProjectPath(tempDir);
      expect(result.valid).toBe(true);
      expect(result.normalizedPath).toBeDefined();
    });

    it('存在しないディレクトリを拒否する', async () => {
      const result = await validateProjectPath('/non/existent/directory');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('危険なシステムディレクトリを拒否する', async () => {
      const result = await validateProjectPath('/etc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('system directories');
    });

    it('パストラバーサル攻撃を拒否する', async () => {
      const result = await validateProjectPath('/home/../etc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('system directories');
    });

    it('相対パスを拒否する', async () => {
      const result = await validateProjectPath('./relative/path');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('absolute path');
    });

    it('空文字列を拒否する', async () => {
      const result = await validateProjectPath('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Project path is required and must be a string');
    });
  });
});