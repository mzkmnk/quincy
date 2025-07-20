import { EventEmitter } from 'events';

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';

import { createEnhancedProcessTermination } from '../../../../services/amazon-q-cli/process-manager/enhanced-process-termination';

// stdio streamsのモックタイプ定義
interface MockStream extends EventEmitter {
  end: MockedFunction<any>;
  finish: MockedFunction<any>;
  readable?: boolean;
  writable?: boolean;
}

// プロセスモック用のタイプ定義
interface MockProcess extends EventEmitter {
  stdout: MockStream;
  stderr: MockStream;
  stdin: MockStream;
  pid: number;
  exitCode?: number | null;
  signalCode?: string | null;
}

describe('enhanced-process-termination', () => {
  let mockProcess: MockProcess;
  let mockStdout: MockStream;
  let mockStderr: MockStream;
  let mockStdin: MockStream;

  beforeEach(() => {
    // stdio streamsのモック作成
    mockStdout = new EventEmitter() as MockStream;
    mockStdout.end = vi.fn();
    mockStdout.readable = true;

    mockStderr = new EventEmitter() as MockStream;
    mockStderr.end = vi.fn();
    mockStderr.readable = true;

    mockStdin = new EventEmitter() as MockStream;
    mockStdin.finish = vi.fn();
    mockStdin.writable = true;

    // プロセスモックの作成
    mockProcess = new EventEmitter() as MockProcess;
    mockProcess.stdout = mockStdout;
    mockProcess.stderr = mockStderr;
    mockProcess.stdin = mockStdin;
    mockProcess.pid = 12345;
    mockProcess.exitCode = null;
    mockProcess.signalCode = null;
  });

  describe('統合終了検出システム', () => {
    it('プロセス終了とストリーム終了を統合して検出する', async () => {
      const onFullyTerminated = vi.fn();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited: vi.fn(),
        onStreamsClosed: vi.fn(),
        onFullyTerminated,
        timeout: 5000,
      });

      // プロセス終了
      mockProcess.exitCode = 0;
      mockProcess.emit('exit', 0, null);

      // 全ストリーム終了
      mockStdout.emit('end');
      mockStderr.emit('end');
      mockStdin.emit('finish');

      expect(onFullyTerminated).toHaveBeenCalledTimes(1);
      expect(onFullyTerminated).toHaveBeenCalledWith({
        processId: 12345,
        exitCode: 0,
        signal: null,
        completedStreams: ['stdout', 'stderr', 'stdin'],
        terminationState: 'fully-terminated',
        timestamp: expect.any(Number),
        duration: expect.any(Number),
      });
    });

    it('ストリーム完了後にプロセス終了でも正しく検出する', async () => {
      const onFullyTerminated = vi.fn();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited: vi.fn(),
        onStreamsClosed: vi.fn(),
        onFullyTerminated,
        timeout: 5000,
      });

      // 先にストリーム終了
      mockStdout.emit('end');
      mockStderr.emit('end');
      mockStdin.emit('finish');

      // 後でプロセス終了
      mockProcess.exitCode = 0;
      mockProcess.emit('exit', 0, null);

      expect(onFullyTerminated).toHaveBeenCalledTimes(1);
    });
  });

  describe('段階的終了イベント', () => {
    it('プロセス終了時にonProcessExitedが呼ばれる', async () => {
      const onProcessExited = vi.fn();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited,
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        timeout: 5000,
      });

      mockProcess.exitCode = 1;
      mockProcess.signalCode = 'SIGTERM';
      mockProcess.emit('exit', 1, 'SIGTERM');

      expect(onProcessExited).toHaveBeenCalledTimes(1);
      expect(onProcessExited).toHaveBeenCalledWith({
        processId: 12345,
        exitCode: 1,
        signal: 'SIGTERM',
        timestamp: expect.any(Number),
      });
    });

    it('全ストリーム終了時にonStreamsClosedが呼ばれる', async () => {
      const onStreamsClosed = vi.fn();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited: vi.fn(),
        onStreamsClosed,
        onFullyTerminated: vi.fn(),
        timeout: 5000,
      });

      mockStdout.emit('end');
      mockStderr.emit('end');
      mockStdin.emit('finish');

      expect(onStreamsClosed).toHaveBeenCalledTimes(1);
      expect(onStreamsClosed).toHaveBeenCalledWith({
        processId: 12345,
        completedStreams: ['stdout', 'stderr', 'stdin'],
        timestamp: expect.any(Number),
      });
    });

    it('個別ストリーム終了時にonStreamEndedが呼ばれる', async () => {
      const onStreamEnded = vi.fn();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited: vi.fn(),
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        onStreamEnded,
        timeout: 5000,
      });

      mockStdout.emit('end');

      expect(onStreamEnded).toHaveBeenCalledWith({
        processId: 12345,
        stream: 'stdout',
        completedStreams: ['stdout'],
        timestamp: expect.any(Number),
      });
    });
  });

  describe('closeイベントによる補完検出', () => {
    it('exitイベントが発生しない場合でもcloseイベントで検出する', async () => {
      const onProcessExited = vi.fn();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited,
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        timeout: 5000,
      });

      // closeイベントでのみ終了
      mockProcess.exitCode = 0;
      mockProcess.emit('close', 0, null);

      expect(onProcessExited).toHaveBeenCalledWith({
        processId: 12345,
        exitCode: 0,
        signal: null,
        timestamp: expect.any(Number),
      });
    });

    it('exitとcloseの両方が発生してもonProcessExitedは一度だけ呼ばれる', async () => {
      const onProcessExited = vi.fn();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited,
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        timeout: 5000,
      });

      mockProcess.exitCode = 0;
      mockProcess.emit('exit', 0, null);
      mockProcess.emit('close', 0, null);

      expect(onProcessExited).toHaveBeenCalledTimes(1);
    });
  });

  describe('タイムアウト処理', () => {
    it('指定時間内に終了しない場合にonTimeoutが呼ばれる', async () => {
      const onTimeout = vi.fn();

      vi.useFakeTimers();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited: vi.fn(),
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        onTimeout,
        timeout: 5000,
      });

      // プロセスのみ終了、ストリームは残る
      mockProcess.exitCode = 0;
      mockProcess.emit('exit', 0, null);
      mockStdout.emit('end');

      vi.advanceTimersByTime(5000);

      expect(onTimeout).toHaveBeenCalledWith({
        processId: 12345,
        reason: 'streams-incomplete',
        completedStreams: ['stdout'],
        pendingStreams: ['stderr', 'stdin'],
        timeout: 5000,
        timestamp: expect.any(Number),
      });

      vi.useRealTimers();
    });

    it('プロセスが終了しない場合のタイムアウト', async () => {
      const onTimeout = vi.fn();

      vi.useFakeTimers();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited: vi.fn(),
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        onTimeout,
        timeout: 5000,
      });

      // ストリームのみ終了
      mockStdout.emit('end');
      mockStderr.emit('end');
      mockStdin.emit('finish');

      vi.advanceTimersByTime(5000);

      expect(onTimeout).toHaveBeenCalledWith({
        processId: 12345,
        reason: 'process-not-exited',
        completedStreams: ['stdout', 'stderr', 'stdin'],
        pendingStreams: [],
        timeout: 5000,
        timestamp: expect.any(Number),
      });

      vi.useRealTimers();
    });

    it('完全終了時にタイムアウトがクリアされる', async () => {
      const onTimeout = vi.fn();

      vi.useFakeTimers();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited: vi.fn(),
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        onTimeout,
        timeout: 5000,
      });

      // 完全終了
      mockProcess.exitCode = 0;
      mockProcess.emit('exit', 0, null);
      mockStdout.emit('end');
      mockStderr.emit('end');
      mockStdin.emit('finish');

      vi.advanceTimersByTime(5000);

      expect(onTimeout).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('エラーハンドリング', () => {
    it('プロセスエラー時にonErrorが呼ばれる', async () => {
      const onError = vi.fn();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited: vi.fn(),
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        onError,
        timeout: 5000,
      });

      const testError = new Error('Process error');
      mockProcess.emit('error', testError);

      expect(onError).toHaveBeenCalledWith({
        processId: 12345,
        error: testError,
        source: 'process',
        timestamp: expect.any(Number),
      });
    });

    it('ストリームエラー時にonErrorが呼ばれる', async () => {
      const onError = vi.fn();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited: vi.fn(),
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        onError,
        timeout: 5000,
      });

      const testError = new Error('Stream error');
      mockStdout.emit('error', testError);

      expect(onError).toHaveBeenCalledWith({
        processId: 12345,
        error: testError,
        source: 'stdout',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('状態取得', () => {
    it('現在の終了状態を取得できる', async () => {
      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited: vi.fn(),
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        timeout: 5000,
      });

      // 初期状態
      let status = termination.getStatus();
      expect(status.isProcessExited).toBe(false);
      expect(status.areStreamsComplete).toBe(false);
      expect(status.isFullyTerminated).toBe(false);
      expect(status.completedStreams).toEqual([]);

      // プロセス終了後
      mockProcess.exitCode = 0;
      mockProcess.emit('exit', 0, null);
      status = termination.getStatus();
      expect(status.isProcessExited).toBe(true);
      expect(status.exitCode).toBe(0);

      // 一部ストリーム終了後
      mockStdout.emit('end');
      status = termination.getStatus();
      expect(status.completedStreams).toEqual(['stdout']);
      expect(status.areStreamsComplete).toBe(false);

      // 全ストリーム終了後
      mockStderr.emit('end');
      mockStdin.emit('finish');
      status = termination.getStatus();
      expect(status.areStreamsComplete).toBe(true);
      expect(status.isFullyTerminated).toBe(true);
    });
  });

  describe('リソース管理', () => {
    it('destroyメソッドで全てのリスナーとタイマーがクリアされる', async () => {
      vi.useFakeTimers();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited: vi.fn(),
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        timeout: 5000,
      });

      // 初期状態でリスナーが登録されていることを確認
      expect(mockProcess.listenerCount('exit')).toBeGreaterThan(0);
      expect(mockStdout.listenerCount('end')).toBeGreaterThan(0);

      termination.destroy();

      // リスナーが削除されていることを確認
      expect(mockProcess.listenerCount('exit')).toBe(0);
      expect(mockProcess.listenerCount('close')).toBe(0);
      expect(mockStdout.listenerCount('end')).toBe(0);
      expect(mockStderr.listenerCount('end')).toBe(0);
      expect(mockStdin.listenerCount('finish')).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('強制終了の検出', () => {
    it('SIGKILLによる強制終了を検出する', async () => {
      const onProcessExited = vi.fn();

      const termination = createEnhancedProcessTermination(mockProcess, {
        onProcessExited,
        onStreamsClosed: vi.fn(),
        onFullyTerminated: vi.fn(),
        timeout: 5000,
      });

      mockProcess.exitCode = null;
      mockProcess.signalCode = 'SIGKILL';
      mockProcess.emit('exit', null, 'SIGKILL');

      expect(onProcessExited).toHaveBeenCalledWith({
        processId: 12345,
        exitCode: null,
        signal: 'SIGKILL',
        timestamp: expect.any(Number),
      });
    });
  });
});
