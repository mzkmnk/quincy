/**
 * Amazon Q CLI Service Test
 * TDD approach: テストファーストで実装
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

import { AmazonQCLIService, QProcessOptions } from '../services/amazon-q-cli';
import * as pathValidator from '../utils/path-validator';
import * as cliValidator from '../utils/cli-validator';

// 外部依存関係のモック
jest.mock('child_process');
jest.mock('util');

// Child processのモック型定義
interface MockChildProcess extends EventEmitter {
  pid?: number;
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: {
    write: jest.Mock;
    destroyed: boolean;
  };
  kill: jest.Mock;
  killed: boolean;
}

// child_processモジュールのモック
const mockChildProcess: MockChildProcess = new EventEmitter() as MockChildProcess;
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
    // spawn後にすぐにspawnイベントを発行（非同期で）
    setTimeout(() => {
      mockChildProcess.emit('spawn');
    }, 10);
    return mockChildProcess;
  }),
}));

describe('AmazonQCLIService', () => {
  let service: AmazonQCLIService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // パス検証のモック - 常に成功を返す
    jest.spyOn(pathValidator, 'validateProjectPath').mockResolvedValue({
      valid: true,
      normalizedPath: '/test/path'
    });
    
    // CLI可用性チェックのモック - 常に成功を返す
    jest.spyOn(cliValidator, 'checkCLIAvailability').mockResolvedValue({
      available: true,
      path: 'q'
    });
    
    jest.spyOn(cliValidator, 'isValidCLIPath').mockReturnValue(true);
    jest.spyOn(cliValidator, 'getCLICandidates').mockReturnValue(['q', '/usr/local/bin/q']);
    
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
    jest.restoreAllMocks();
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
    it('プロセスの標準出力をq:responseイベントとして発行すること', done => {
      const options: QProcessOptions = { workingDir: '/test/path' };

      service.on('q:response', data => {
        expect(data.data).toBe('Hello from Q CLI');
        expect(data.type).toBe('stream');
        expect(data.sessionId).toMatch(/^q_session_/);
        done();
      });

      service.startSession('help', options).then(() => {
        mockChildProcess.stdout.emit('data', Buffer.from('Hello from Q CLI'));
      });
    });

    it('プロセスのエラー出力をq:errorイベントとして発行すること', done => {
      const options: QProcessOptions = { workingDir: '/test/path' };

      service.on('q:error', data => {
        expect(data.error).toBe('Error message');
        expect(data.code).toBe('STDERR');
        expect(data.sessionId).toMatch(/^q_session_/);
        done();
      });

      service.startSession('help', options).then(() => {
        mockChildProcess.stderr.emit('data', Buffer.from('Error message'));
      });
    });

    it('プロセス終了をq:completeイベントとして発行すること', done => {
      const options: QProcessOptions = { workingDir: '/test/path' };

      service.on('q:complete', data => {
        expect(data.exitCode).toBe(0);
        expect(data.sessionId).toMatch(/^q_session_/);
        done();
      });

      service.startSession('help', options).then(() => {
        mockChildProcess.emit('exit', 0, null);
      });
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
