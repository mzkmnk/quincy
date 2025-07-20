import { EventEmitter } from 'events';

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';

import { createStdioMonitor } from '../../../../services/amazon-q-cli/process-manager/stdio-monitor';

// stdio streamsのモックタイプ定義
interface MockStream extends EventEmitter {
  end: MockedFunction<() => void>;
  finish: MockedFunction<() => void>;
  readable?: boolean;
  writable?: boolean;
}

// プロセスモック用のタイプ定義
interface MockProcess extends EventEmitter {
  stdout: MockStream;
  stderr: MockStream;
  stdin: MockStream;
  pid: number;
}

describe('stdio-monitor', () => {
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
  });

  describe('stdio streams個別監視', () => {
    it('stdoutのendイベントを監視できる', async () => {
      const onStdoutEnd = vi.fn();

      createStdioMonitor(mockProcess, {
        onStdoutEnd,
        onStderrEnd: vi.fn(),
        onStdinFinish: vi.fn(),
        timeout: 1000,
      });

      // stdoutのendイベントを発火
      mockStdout.emit('end');

      expect(onStdoutEnd).toHaveBeenCalledTimes(1);
      expect(onStdoutEnd).toHaveBeenCalledWith({
        processId: 12345,
        stream: 'stdout',
        timestamp: expect.any(Number),
      });
    });

    it('stderrのendイベントを監視できる', async () => {
      const onStderrEnd = vi.fn();

      createStdioMonitor(mockProcess, {
        onStdoutEnd: vi.fn(),
        onStderrEnd,
        onStdinFinish: vi.fn(),
        timeout: 1000,
      });

      // stderrのendイベントを発火
      mockStderr.emit('end');

      expect(onStderrEnd).toHaveBeenCalledTimes(1);
      expect(onStderrEnd).toHaveBeenCalledWith({
        processId: 12345,
        stream: 'stderr',
        timestamp: expect.any(Number),
      });
    });

    it('stdinのfinishイベントを監視できる', async () => {
      const onStdinFinish = vi.fn();

      createStdioMonitor(mockProcess, {
        onStdoutEnd: vi.fn(),
        onStderrEnd: vi.fn(),
        onStdinFinish,
        timeout: 1000,
      });

      // stdinのfinishイベントを発火
      mockStdin.emit('finish');

      expect(onStdinFinish).toHaveBeenCalledTimes(1);
      expect(onStdinFinish).toHaveBeenCalledWith({
        processId: 12345,
        stream: 'stdin',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('全ストリーム終了検出', () => {
    it('全てのstdio streamsが終了したときにonAllStreamsClosed コールバックが呼ばれる', async () => {
      const onAllStreamsClosed = vi.fn();

      createStdioMonitor(mockProcess, {
        onStdoutEnd: vi.fn(),
        onStderrEnd: vi.fn(),
        onStdinFinish: vi.fn(),
        onAllStreamsClosed,
        timeout: 1000,
      });

      // 全てのstreamsを順次終了
      mockStdout.emit('end');
      mockStderr.emit('end');
      mockStdin.emit('finish');

      expect(onAllStreamsClosed).toHaveBeenCalledTimes(1);
      expect(onAllStreamsClosed).toHaveBeenCalledWith({
        processId: 12345,
        completedStreams: ['stdout', 'stderr', 'stdin'],
        timestamp: expect.any(Number),
      });
    });

    it('ストリームの終了順序が異なっても正しく検出する', async () => {
      const onAllStreamsClosed = vi.fn();

      createStdioMonitor(mockProcess, {
        onStdoutEnd: vi.fn(),
        onStderrEnd: vi.fn(),
        onStdinFinish: vi.fn(),
        onAllStreamsClosed,
        timeout: 1000,
      });

      // 異なる順序で終了
      mockStdin.emit('finish');
      mockStderr.emit('end');
      mockStdout.emit('end');

      expect(onAllStreamsClosed).toHaveBeenCalledTimes(1);
    });
  });

  describe('タイムアウト機能', () => {
    it('指定時間内にstreamsが終了しない場合にタイムアウトコールバックが呼ばれる', async () => {
      const onTimeout = vi.fn();

      vi.useFakeTimers();

      createStdioMonitor(mockProcess, {
        onStdoutEnd: vi.fn(),
        onStderrEnd: vi.fn(),
        onStdinFinish: vi.fn(),
        onTimeout,
        timeout: 1000,
      });

      // 1つのストリームのみ終了
      mockStdout.emit('end');

      // タイムアウト時間経過
      vi.advanceTimersByTime(1000);

      expect(onTimeout).toHaveBeenCalledTimes(1);
      expect(onTimeout).toHaveBeenCalledWith({
        processId: 12345,
        completedStreams: ['stdout'],
        pendingStreams: ['stderr', 'stdin'],
        timeout: 1000,
        reason: 'streams-incomplete',
        timestamp: expect.any(Number),
      });

      vi.useRealTimers();
    });

    it('全ストリームが終了した場合にタイムアウトをクリアする', async () => {
      const onTimeout = vi.fn();
      const onAllStreamsClosed = vi.fn();

      vi.useFakeTimers();

      createStdioMonitor(mockProcess, {
        onStdoutEnd: vi.fn(),
        onStderrEnd: vi.fn(),
        onStdinFinish: vi.fn(),
        onAllStreamsClosed,
        onTimeout,
        timeout: 1000,
      });

      // 全てのstreamsを終了
      mockStdout.emit('end');
      mockStderr.emit('end');
      mockStdin.emit('finish');

      // タイムアウト時間経過
      vi.advanceTimersByTime(1000);

      expect(onAllStreamsClosed).toHaveBeenCalledTimes(1);
      expect(onTimeout).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('エラーハンドリング', () => {
    it('stdio streamsでエラーが発生した場合にエラーコールバックが呼ばれる', async () => {
      const onError = vi.fn();

      createStdioMonitor(mockProcess, {
        onStdoutEnd: vi.fn(),
        onStderrEnd: vi.fn(),
        onStdinFinish: vi.fn(),
        onError,
        timeout: 1000,
      });

      const testError = new Error('Stream error');
      mockStdout.emit('error', testError);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith({
        processId: 12345,
        error: testError,
        stream: 'stdout',
        source: 'stdout',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('リソース管理', () => {
    it('destroyメソッドで全てのリスナーを削除する', async () => {
      const monitor = createStdioMonitor(mockProcess, {
        onStdoutEnd: vi.fn(),
        onStderrEnd: vi.fn(),
        onStdinFinish: vi.fn(),
        timeout: 1000,
      });

      // 初期状態でリスナーが登録されていることを確認
      expect(mockStdout.listenerCount('end')).toBe(1);
      expect(mockStderr.listenerCount('end')).toBe(1);
      expect(mockStdin.listenerCount('finish')).toBe(1);

      // destroyを呼び出し
      monitor.destroy();

      // リスナーが削除されていることを確認
      expect(mockStdout.listenerCount('end')).toBe(0);
      expect(mockStderr.listenerCount('end')).toBe(0);
      expect(mockStdin.listenerCount('finish')).toBe(0);
    });

    it('getStatusメソッドで現在の状態を取得できる', async () => {
      const monitor = createStdioMonitor(mockProcess, {
        onStdoutEnd: vi.fn(),
        onStderrEnd: vi.fn(),
        onStdinFinish: vi.fn(),
        timeout: 1000,
      });

      // 初期状態
      let status = monitor.getStatus();
      expect(status.completedStreams).toEqual([]);
      expect(status.pendingStreams).toEqual(['stdout', 'stderr', 'stdin']);
      expect(status.isComplete).toBe(false);

      // 1つのストリーム終了後
      mockStdout.emit('end');
      status = monitor.getStatus();
      expect(status.completedStreams).toEqual(['stdout']);
      expect(status.pendingStreams).toEqual(['stderr', 'stdin']);
      expect(status.isComplete).toBe(false);

      // 全ストリーム終了後
      mockStderr.emit('end');
      mockStdin.emit('finish');
      status = monitor.getStatus();
      expect(status.completedStreams).toEqual(['stdout', 'stderr', 'stdin']);
      expect(status.pendingStreams).toEqual([]);
      expect(status.isComplete).toBe(true);
    });
  });
});
