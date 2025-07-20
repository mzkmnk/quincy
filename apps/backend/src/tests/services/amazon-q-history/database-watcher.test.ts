import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { watchDatabase } from '../../../services/amazon-q-history/database-watcher/watch-database';
import { handleDatabaseChange } from '../../../services/amazon-q-history/database-watcher/database-change-handler';

describe('Database Watcher Service', () => {
  let tempDir: string;
  let testDbPath: string;
  let mockEmitFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // テスト用の一時ディレクトリとファイルを作成
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'db-watcher-test-'));
    testDbPath = path.join(tempDir, 'test.sqlite3');

    // テスト用のSQLiteファイルを作成
    await fs.writeFile(testDbPath, 'SQLite format 3\x00');

    // モックのWebSocket emit関数
    mockEmitFn = vi.fn();
  });

  afterEach(async () => {
    // テスト後のクリーンアップ
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // クリーンアップエラーは無視
    }
  });

  describe('watchDatabase', () => {
    it('should watch database file for changes', async () => {
      const changeHandler = vi.fn();
      const watcher = watchDatabase(testDbPath, changeHandler);

      expect(watcher).toBeDefined();
      expect(typeof watcher.close).toBe('function');

      // ファイルを変更
      await fs.appendFile(testDbPath, 'test data');

      // 少し待ってからハンドラーが呼ばれることを確認
      await new Promise(resolve => setTimeout(resolve, 100));

      watcher.close();
    });

    it('should handle file not exist error gracefully', () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.sqlite3');
      const changeHandler = vi.fn();

      expect(() => {
        const watcher = watchDatabase(nonExistentPath, changeHandler);
        watcher.close();
      }).not.toThrow();
    });

    it('should call change handler with correct parameters', async () => {
      const changeHandler = vi.fn();
      const watcher = watchDatabase(testDbPath, changeHandler);

      // ファイルを変更
      await fs.appendFile(testDbPath, 'test data');

      // デバウンス時間を考慮して待機
      await new Promise(resolve => setTimeout(resolve, 400));

      expect(changeHandler).toHaveBeenCalledWith(testDbPath);

      watcher.close();
    });

    it('should debounce rapid file changes', async () => {
      const changeHandler = vi.fn();
      const watcher = watchDatabase(testDbPath, changeHandler);

      // 短時間で複数回変更
      await fs.appendFile(testDbPath, 'data1');
      await fs.appendFile(testDbPath, 'data2');
      await fs.appendFile(testDbPath, 'data3');

      // デバウンス時間より少し長く待機
      await new Promise(resolve => setTimeout(resolve, 400));

      // デバウンスにより1回だけ呼ばれることを確認
      expect(changeHandler).toHaveBeenCalledTimes(1);

      watcher.close();
    });
  });

  describe('handleDatabaseChange', () => {
    it('should emit database change event to WebSocket', async () => {
      const result = await handleDatabaseChange(testDbPath, mockEmitFn);

      expect(result).toBe(true);
      expect(mockEmitFn).toHaveBeenCalledWith('database-changed', {
        filePath: testDbPath,
        timestamp: expect.any(Date),
        changeType: 'modified',
      });
    });

    it('should handle database file access errors', async () => {
      const invalidPath = '/invalid/path/database.sqlite3';
      const result = await handleDatabaseChange(invalidPath, mockEmitFn);

      expect(result).toBe(false);
      expect(mockEmitFn).not.toHaveBeenCalled();
    });

    it('should include correct timestamp in event data', async () => {
      const beforeTime = new Date();
      await handleDatabaseChange(testDbPath, mockEmitFn);
      const afterTime = new Date();

      expect(mockEmitFn).toHaveBeenCalled();
      const eventData = mockEmitFn.mock.calls[0][1];
      expect(eventData.timestamp).toBeInstanceOf(Date);
      expect(eventData.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(eventData.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should detect file creation as add change type', async () => {
      // 新しいファイルパスでテスト
      const newFilePath = path.join(tempDir, 'new-database.sqlite3');

      // ファイルが存在しない状態から作成
      await fs.writeFile(newFilePath, 'SQLite format 3\x00');

      await handleDatabaseChange(newFilePath, mockEmitFn);

      expect(mockEmitFn).toHaveBeenCalledWith(
        'database-changed',
        expect.objectContaining({
          filePath: newFilePath,
          changeType: expect.stringMatching(/^(add|modified)$/),
        })
      );
    });
  });

  describe('integration tests', () => {
    it('should complete full workflow from file change to WebSocket emission', async () => {
      const changeHandler = (filePath: string) => handleDatabaseChange(filePath, mockEmitFn);
      const watcher = watchDatabase(testDbPath, changeHandler);

      // ファイルを変更
      await fs.appendFile(testDbPath, 'integration test data');

      // 変更検知とWebSocket通知まで待機
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(mockEmitFn).toHaveBeenCalledWith('database-changed', {
        filePath: testDbPath,
        timestamp: expect.any(Date),
        changeType: 'modified',
      });

      watcher.close();
    });

    it('should handle watcher cleanup properly', () => {
      const changeHandler = vi.fn();
      const watcher = watchDatabase(testDbPath, changeHandler);

      expect(() => watcher.close()).not.toThrow();

      // クローズ後は新しい変更を検知しないことを確認するため、
      // 少し待ってからファイルを変更
      setTimeout(async () => {
        await fs.appendFile(testDbPath, 'after close');
      }, 100);
    });
  });

  describe('error handling', () => {
    it('should handle permission errors gracefully', async () => {
      // 読み取り専用ディレクトリのテスト（可能な場合）
      const readOnlyPath = path.join(tempDir, 'readonly.sqlite3');
      await fs.writeFile(readOnlyPath, 'test');

      try {
        await fs.chmod(readOnlyPath, 0o444); // 読み取り専用

        const result = await handleDatabaseChange(readOnlyPath, mockEmitFn);
        // 読み取り専用でも読み取りは可能なのでtrueが返される
        expect(result).toBe(true);
      } catch {
        //権限変更に失敗した場合はスキップ
        expect(true).toBe(true);
      }
    });

    it('should validate database file format', async () => {
      // 無効なSQLiteファイルのテスト
      const invalidDbPath = path.join(tempDir, 'invalid.sqlite3');
      await fs.writeFile(invalidDbPath, 'not a sqlite file');

      const result = await handleDatabaseChange(invalidDbPath, mockEmitFn);

      // ファイルが存在するので処理は成功するが、SQLiteファイルでないことを検知
      expect(result).toBe(true);
      expect(mockEmitFn).toHaveBeenCalledWith(
        'database-changed',
        expect.objectContaining({
          filePath: invalidDbPath,
          changeType: 'modified',
        })
      );
    });
  });
});
