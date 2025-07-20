/**
 * Amazon Q CLI Service Test
 * TDD approach: テストファーストで実装
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

import { vi } from 'vitest';

import { AmazonQCLIService, QProcessOptions } from '../services/amazon-q-cli';
import * as pathValidator from '../utils/path-validator';
import * as cliValidator from '../utils/cli-validator';

// 外部依存関係のモック
vi.mock('child_process');
vi.mock('util');

// Child processのモック型定義
interface MockChildProcess extends EventEmitter {
  pid?: number;
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: {
    write: ReturnType<typeof vi.fn>;
    destroyed: boolean;
  };
  kill: ReturnType<typeof vi.fn>;
  killed: boolean;
}

// child_processモジュールのモック
const mockChildProcess: MockChildProcess = new EventEmitter() as MockChildProcess;
mockChildProcess.pid = 12345;
mockChildProcess.stdout = new EventEmitter();
mockChildProcess.stderr = new EventEmitter();
mockChildProcess.stdin = {
  write: vi.fn(),
  destroyed: false,
};
mockChildProcess.kill = vi.fn();
mockChildProcess.killed = false;

vi.mock('child_process', () => ({
  spawn: vi.fn(() => {
    // spawn後にすぐにspawnイベントを発行（非同期で）
    setTimeout(() => {
      mockChildProcess.emit('spawn');
    }, 10);
    return mockChildProcess;
  }),
  exec: vi.fn(),
}));

describe('AmazonQCLIService', () => {
  let service: AmazonQCLIService;

  beforeEach(() => {
    vi.clearAllMocks();

    // パス検証のモック - 常に成功を返す
    vi.spyOn(pathValidator, 'validateProjectPath').mockResolvedValue({
      valid: true,
      normalizedPath: '/test/path',
    });

    // CLI可用性チェックのモック - 常に成功を返す
    vi.spyOn(cliValidator, 'checkCLIAvailability').mockResolvedValue({
      available: true,
      path: 'q',
    });

    vi.spyOn(cliValidator, 'isValidCLIPath').mockReturnValue(true);
    vi.spyOn(cliValidator, 'getCLICandidates').mockReturnValue(['q', '/usr/local/bin/q']);

    service = new AmazonQCLIService();

    // EventEmitterの最大リスナー数を増加
    service.setMaxListeners(20);

    // モック状態のリセット
    mockChildProcess.killed = false;
    mockChildProcess.stdin.destroyed = false;

    // EventEmitterのリセット
    mockChildProcess.removeAllListeners();
    mockChildProcess.stdout.removeAllListeners();
    mockChildProcess.stderr.removeAllListeners();
  });

  afterEach(async (): Promise<void> => {
    await service.terminateAllSessions();

    // EventEmitterのクリーンアップ
    service.removeAllListeners();
    mockChildProcess.removeAllListeners();
    mockChildProcess.stdout.removeAllListeners();
    mockChildProcess.stderr.removeAllListeners();

    // spyの復元
    vi.restoreAllMocks();
  });

  describe('インスタンス作成', () => {
    it('AmazonQCLIServiceのインスタンスが作成できること', () => {
      expect(service).toBeInstanceOf(AmazonQCLIService);
      expect(service).toBeInstanceOf(EventEmitter);
    });
  });

  describe('startSession', () => {
    it('基本的なコマンドでセッションを開始できること', async () => {
      const options: QProcessOptions = {
        workingDir: '/test/path',
      };

      const sessionId = await service.startSession('help', options);

      expect(sessionId).toMatch(/^q_session_\d+_[a-z0-9]+$/);
      expect(spawn).toHaveBeenCalledWith('q', ['help'], {
        cwd: '/test/path',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: expect.objectContaining({
          AWS_PAGER: '',
          NO_COLOR: '1',
        }),
      });
    });

    it('modelオプション付きでセッションを開始できること', async () => {
      const options: QProcessOptions = {
        workingDir: '/test/path',
        model: 'claude-3-sonnet',
      };

      await service.startSession('chat "Hello"', options);

      expect(spawn).toHaveBeenCalledWith(
        'q',
        ['--model', 'claude-3-sonnet', 'chat', '"Hello"'],
        expect.objectContaining({ cwd: '/test/path' })
      );
    });

    it('resumeオプション付きでセッションを開始できること', async () => {
      const options: QProcessOptions = {
        workingDir: '/test/path',
        resume: true,
      };

      await service.startSession('status', options);

      expect(spawn).toHaveBeenCalledWith(
        'q',
        ['--resume', 'status'],
        expect.objectContaining({ cwd: '/test/path' })
      );
    });

    it('複数オプション組み合わせでセッションを開始できること', async () => {
      const options: QProcessOptions = {
        workingDir: '/test/path',
        model: 'claude-3-sonnet',
        resume: true,
      };

      await service.startSession('chat test', options);

      expect(spawn).toHaveBeenCalledWith(
        'q',
        ['--model', 'claude-3-sonnet', '--resume', 'chat', 'test'],
        expect.objectContaining({ cwd: '/test/path' })
      );
    });
  });

  describe('abortSession', () => {
    it('存在するセッションを中止できること', async () => {
      const options: QProcessOptions = { workingDir: '/test/path' };
      const sessionId = await service.startSession('help', options);

      const result = await service.abortSession(sessionId);

      expect(result).toBe(true);
      expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('存在しないセッションの中止はfalseを返すこと', async () => {
      const result = await service.abortSession('nonexistent_session');
      expect(result).toBe(false);
    });

    it('中止理由を指定できること', async () => {
      const options: QProcessOptions = { workingDir: '/test/path' };
      const sessionId = await service.startSession('help', options);

      const result = await service.abortSession(sessionId, 'user_cancellation');

      expect(result).toBe(true);
    });
  });

  describe('sendInput', () => {
    it('実行中セッションに入力を送信できること', async () => {
      const options: QProcessOptions = { workingDir: '/test/path' };
      const sessionId = await service.startSession('help', options);

      // セッションを手動で実行中状態に設定
      const session = service.getSession(sessionId);
      if (session) {
        session.status = 'running';
      }

      const result = await service.sendInput(sessionId, 'test input\n');

      expect(result).toBe(true);
      expect(mockChildProcess.stdin.write).toHaveBeenCalledWith('test input\n');
    });

    it('存在しないセッションへの入力はfalseを返すこと', async () => {
      const result = await service.sendInput('nonexistent', 'test');
      expect(result).toBe(false);
    });

    it('実行中ではないセッションへの入力はfalseを返すこと', async () => {
      const options: QProcessOptions = { workingDir: '/test/path' };
      const sessionId = await service.startSession('help', options);

      // セッションを完了状態に設定
      const session = service.getSession(sessionId);
      if (session) {
        session.status = 'completed';
      }

      const result = await service.sendInput(sessionId, 'test');
      expect(result).toBe(false);
    });
  });

  describe('セッション管理', () => {
    it('アクティブセッション一覧を取得できること', async () => {
      const options: QProcessOptions = { workingDir: '/test/path' };

      const sessionId1 = await service.startSession('help', options);
      const sessionId2 = await service.startSession('status', options);

      const activeSessions = service.getActiveSessions();

      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.map(s => s.sessionId)).toContain(sessionId1);
      expect(activeSessions.map(s => s.sessionId)).toContain(sessionId2);
    });

    it('指定セッションの情報を取得できること', async () => {
      const options: QProcessOptions = {
        workingDir: '/test/path',
        model: 'claude-3-sonnet',
      };
      const sessionId = await service.startSession('help', options);

      const session = service.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.workingDir).toBe('/test/path');
      expect(session?.command).toBe('help');
      expect(session?.options.model).toBe('claude-3-sonnet');
      expect(session?.pid).toBe(12345);
    });

    it('セッション統計を取得できること', async () => {
      const options: QProcessOptions = { workingDir: '/test/path' };
      const sessionId = await service.startSession('help', options);

      const stats = service.getSessionStats(sessionId);

      expect(stats).toMatchObject({
        sessionId,
        pid: 12345,
        status: expect.stringMatching(/^(starting|running)$/), // starting または running を許可
        workingDir: '/test/path',
        command: 'help',
        isActive: true,
      });
      expect(typeof stats?.runtime).toBe('number');
      expect(stats?.runtime).toBeGreaterThanOrEqual(0);
    });

    it('存在しないセッションの統計はnullを返すこと', () => {
      const stats = service.getSessionStats('nonexistent');
      expect(stats).toBeNull();
    });
  });

  describe('イベント処理', () => {
    it.skip('プロセスの標準出力をq:responseイベントとして発行すること（レガシー：SQLite3で代替）', async () => {
      // このテストはSQLite3変更検知により不要になりました
      // 代わりにSQLite3から最新の会話内容を取得する仕組みに変更
    });

    it.skip('プロセスのエラー出力をq:errorイベントとして発行すること（レガシー：SQLite3で代替）', async () => {
      // このテストはSQLite3変更検知により不要になりました  
      // プロセスエラーはq:errorで継続、stderrストリーミングは削除
    });

    it('プロセス終了をq:completeイベントとして発行すること', async () => {
      const options: QProcessOptions = { workingDir: '/test/path' };

      const promise = new Promise<void>(resolve => {
        service.on('q:complete', data => {
          expect(data.exitCode).toBe(0);
          expect(data.sessionId).toMatch(/^q_session_/);
          resolve();
        });
      });

      await service.startSession('help', options);
      mockChildProcess.emit('exit', 0, null);

      await promise;
    });
  });

  describe('リソース管理', () => {
    it('全セッションを終了できること', async () => {
      const options: QProcessOptions = { workingDir: '/test/path' };

      await service.startSession('help', options);
      await service.startSession('status', options);

      expect(service.getActiveSessions()).toHaveLength(2);

      await service.terminateAllSessions();

      // 少し待ってkillが呼ばれたことを確認
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockChildProcess.kill).toHaveBeenCalledTimes(2);
    });
  });
});
