/**
 * Amazon Q CLI Service Integration Test
 * 複数のコンポーネントを組み合わせた統合テスト
 */

import { EventEmitter } from 'events';
import { promisify } from 'util';

import { AmazonQCLIService } from '../services/amazon-q-cli';
import { validateProjectPath } from '../utils/path-validator';
import { stripAnsiCodes } from '../utils/ansi-stripper';
import { checkCLIAvailability } from '../utils/cli-validator';

// 統合テスト用のモック設定
jest.mock('child_process');
jest.mock('fs');
jest.mock('util');

// 統合テスト用のモック設定
interface MockChildProcess extends EventEmitter {
  pid: number;
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: {
    write: jest.Mock;
    destroyed: boolean;
  };
  kill: jest.Mock;
  killed: boolean;
}

const mockChildProcess = new EventEmitter() as MockChildProcess;
mockChildProcess.pid = 12345;
mockChildProcess.stdout = new EventEmitter();
mockChildProcess.stderr = new EventEmitter();
mockChildProcess.stdin = {
  write: jest.fn(),
  destroyed: false,
};
mockChildProcess.kill = jest.fn();
mockChildProcess.killed = false;

jest.mock('child_process', () => ({
  spawn: jest.fn(() => {
    setTimeout(() => {
      mockChildProcess.emit('spawn');
    }, 10);
    return mockChildProcess;
  }),
}));

// fs.existsSync のモック
const mockExistsSync = jest.fn();
jest.mock('fs', () => ({
  existsSync: mockExistsSync,
}));

// util.promisify のモック
jest.mock('util', () => ({
  promisify: jest.fn(() => jest.fn().mockResolvedValue({ stdout: 'q version 1.0.0', stderr: '' })),
  deprecate: jest.fn((fn, ) => fn),
}));

describe('Amazon Q CLI Service Integration Test', () => {
  let service: AmazonQCLIService;
  const testWorkingDir = '/Users/test/project';
  const testCommand = 'chat "Hello"';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AmazonQCLIService();

    // モックの基本設定
    mockChildProcess.killed = false;
    mockChildProcess.stdin.destroyed = false;
    mockExistsSync.mockReturnValue(true);

    // モックの基本設定をリセット
  });

  afterEach(async (): Promise<void> => {
    await service.terminateAllSessions();
  });

  describe('コンポーネント統合テスト', () => {
    it('パス検証 → セッション作成 → メッセージ送信の統合フローが正常に動作すること', async () => {
      // 1. パス検証
      const pathValidation = await validateProjectPath(testWorkingDir);
      expect(pathValidation.valid).toBe(true);

      // 2. セッション作成
      const sessionId = await service.startSession(testCommand, {
        workingDir: testWorkingDir,
        model: 'claude-3-sonnet',
      });

      // セッションIDの形式確認
      expect(sessionId).toMatch(/^q_session_\d+_[a-z0-9]+$/);

      // 3. セッション状態確認
      const session = service.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.workingDir).toBe(testWorkingDir);
      expect(session?.command).toBe(testCommand);

      // 4. メッセージ送信
      session!.status = 'running';
      const sendResult = await service.sendInput(sessionId, 'test message\n');
      expect(sendResult).toBe(true);
      expect(mockChildProcess.stdin.write).toHaveBeenCalledWith('test message\n');
    });

    it('CLI検証 → ANSI除去 → セッション管理の統合フローが動作すること', async () => {
      // 1. CLI検証
      const cliValidation = await checkCLIAvailability();
      expect(cliValidation.available).toBe(true);

      // 2. セッション作成
      const sessionId = await service.startSession('help', {
        workingDir: testWorkingDir,
      });

      // 3. ANSI文字列を含む出力のシミュレーション
      const ansiOutput = '\x1b[31mError message\x1b[0m';
      const cleanOutput = stripAnsiCodes(ansiOutput);
      expect(cleanOutput).toBe('Error message');

      // 4. セッション統計の確認
      const stats = service.getSessionStats(sessionId);
      expect(stats).toMatchObject({
        sessionId,
        pid: 12345,
        status: expect.stringMatching(/^(starting|running)$/),
        workingDir: testWorkingDir,
        command: 'help',
        isActive: true,
      });
    });

    it('複数セッションの同時管理と終了処理が正常に動作すること', async () => {
      // 1. 複数セッション作成
      const sessionIds = await Promise.all([
        service.startSession('help', { workingDir: testWorkingDir }),
        service.startSession('status', { workingDir: testWorkingDir }),
        service.startSession('chat "test"', { workingDir: testWorkingDir }),
      ]);

      // 2. 全セッションの確認
      const activeSessions = service.getActiveSessions();
      expect(activeSessions).toHaveLength(3);
      expect(activeSessions.map(s => s.sessionId)).toEqual(expect.arrayContaining(sessionIds));

      // 3. 個別セッション中止
      const abortResult = await service.abortSession(sessionIds[0]);
      expect(abortResult).toBe(true);

      // 4. 全セッション終了
      await service.terminateAllSessions();

      // 少し待ってkillが呼ばれたことを確認
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockChildProcess.kill).toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング統合テスト', () => {
    it('無効なパスでのセッション作成時にエラーが適切に処理されること', async () => {
      mockExistsSync.mockReturnValue(false);

      const invalidPath = '/invalid/path';
      const pathValidation = await validateProjectPath(invalidPath);
      expect(pathValidation.valid).toBe(false);
      expect(pathValidation.error).toContain('does not exist');

      // セッション作成時のエラー処理
      await expect(
        service.startSession(testCommand, {
          workingDir: invalidPath,
        })
      ).rejects.toThrow();
    });

    it('CLIが利用不可能な場合のエラー処理が統合的に動作すること', async () => {
      // CLI検証の失敗をシミュレート
      (promisify as jest.Mock).mockReturnValueOnce(
        jest.fn().mockRejectedValue(new Error('q: command not found'))
      );

      const cliValidation = await checkCLIAvailability();
      expect(cliValidation.available).toBe(false);
      expect(cliValidation.error).toContain('q: command not found');
    });

    it('プロセスエラーとイベント発行の統合処理が正常に動作すること', async () => {
      const sessionId = await service.startSession(testCommand, {
        workingDir: testWorkingDir,
      });

      // エラーイベントのリスナー設定
      return new Promise<void>(resolve => {
        service.on('q:error', data => {
          expect(data.sessionId).toBe(sessionId);
          expect(data.error).toBe('Process error');
          expect(data.code).toBe('STDERR');
          resolve();
        });

        // エラーをシミュレート
        mockChildProcess.stderr.emit('data', Buffer.from('Process error'));
      });
    });
  });

  describe('リソース管理統合テスト', () => {
    it('セッション作成からクリーンアップまでのリソース管理が適切に動作すること', async () => {
      // 1. セッション作成
      const sessionId = await service.startSession(testCommand, {
        workingDir: testWorkingDir,
      });

      // 2. セッション実行時のリソース確認
      const sessionBeforeComplete = service.getSession(sessionId);
      expect(sessionBeforeComplete).toBeDefined();
      expect(sessionBeforeComplete?.pid).toBe(12345);

      // 3. セッション完了イベントの発行
      return new Promise<void>(resolve => {
        service.on('q:complete', data => {
          expect(data.sessionId).toBe(sessionId);
          expect(data.exitCode).toBe(0);

          // 4. セッション完了後のクリーンアップ確認
          setTimeout(() => {
            const sessionAfterComplete = service.getSession(sessionId);
            expect(sessionAfterComplete?.status).toBe('completed');
            resolve();
          }, 100);
        });

        // プロセス終了をシミュレート
        mockChildProcess.emit('exit', 0, null);
      });
    });

    it('異常終了時のリソースクリーンアップが統合的に動作すること', async () => {
      const sessionId = await service.startSession(testCommand, {
        workingDir: testWorkingDir,
      });

      return new Promise<void>(resolve => {
        service.on('q:error', data => {
          expect(data.sessionId).toBe(sessionId);
          expect(data.code).toBe('PROCESS_ERROR');

          // 異常終了後のセッション状態確認
          setTimeout(() => {
            const session = service.getSession(sessionId);
            expect(session?.status).toBe('failed');
            resolve();
          }, 100);
        });

        // 異常終了をシミュレート
        mockChildProcess.emit('error', new Error('Process crashed'));
      });
    });
  });

  describe('イベント統合テスト', () => {
    it('複数のイベントが順序立てて発行されること', async () => {
      const _result = startAmazonQCli('test message', {
        workingDir: testWorkingDir,
      });

      const events: string[] = [];

      // イベントリスナーの設定
      service.on('q:response', () => events.push('response'));
      service.on('q:error', () => events.push('error'));
      service.on('q:complete', () => events.push('complete'));

      return new Promise<void>(resolve => {
        let eventCount = 0;
        const expectedEvents = 3;

        const checkComplete = (): void => {
          eventCount++;
          if (eventCount === expectedEvents) {
            expect(events).toEqual(['response', 'error', 'complete']);
            resolve();
          }
        };

        service.on('q:response', checkComplete);
        service.on('q:error', checkComplete);
        service.on('q:complete', checkComplete);

        // イベントを順序立てて発行
        setTimeout(() => {
          mockChildProcess.stdout.emit('data', Buffer.from('Output'));
        }, 10);

        setTimeout(() => {
          mockChildProcess.stderr.emit('data', Buffer.from('Warning'));
        }, 20);

        setTimeout(() => {
          mockChildProcess.emit('exit', 0, null);
        }, 30);
      });
    });
  });
});
