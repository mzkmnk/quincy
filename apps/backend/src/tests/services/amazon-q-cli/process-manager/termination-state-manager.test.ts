import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createTerminationStateManager } from '../../../../services/amazon-q-cli/process-manager/termination-state-manager';

describe('termination-state-manager', () => {
  let stateManager: ReturnType<typeof createTerminationStateManager>;

  beforeEach(() => {
    stateManager = createTerminationStateManager({
      processId: 'test-process-123',
      onStateChange: vi.fn(),
      onFullyTerminated: vi.fn(),
    });
  });

  describe('初期状態', () => {
    it('初期状態はprocess-runningである', () => {
      const state = stateManager.getStatus();
      expect(state.current).toBe('process-running');
      expect(state.processId).toBe('test-process-123');
      expect(state.timestamp).toBeTypeOf('number');
      expect(state.completedStreams).toEqual([]);
    });

    it('初期状態では終了していない', () => {
      expect(stateManager.isFullyTerminated()).toBe(false);
      expect(stateManager.isProcessExited()).toBe(false);
      expect(stateManager.areStreamsComplete()).toBe(false);
    });
  });

  describe('状態遷移', () => {
    it('process-running から process-exited に遷移できる', () => {
      const onStateChange = vi.fn();
      stateManager = createTerminationStateManager({
        processId: 'test-process-123',
        onStateChange,
        onFullyTerminated: vi.fn(),
      });

      const success = stateManager.transitionTo('process-exited', {
        exitCode: 0,
        signal: null,
      });

      expect(success).toBe(true);
      expect(stateManager.getStatus().current).toBe('process-exited');
      expect(stateManager.isProcessExited()).toBe(true);
      expect(onStateChange).toHaveBeenCalledWith({
        from: 'process-running',
        to: 'process-exited',
        processId: 'test-process-123',
        metadata: { exitCode: 0, signal: null },
        timestamp: expect.any(Number),
      });
    });

    it('process-exited から streams-closing に遷移できる', () => {
      stateManager.transitionTo('process-exited', { exitCode: 0, signal: null });

      const success = stateManager.transitionTo('streams-closing', {
        completedStreams: ['stdout'],
      });

      expect(success).toBe(true);
      expect(stateManager.getStatus().current).toBe('streams-closing');
    });

    it('streams-closing から fully-terminated に遷移できる', () => {
      const onFullyTerminated = vi.fn();
      stateManager = createTerminationStateManager({
        processId: 'test-process-123',
        onStateChange: vi.fn(),
        onFullyTerminated,
      });

      stateManager.transitionTo('process-exited', { exitCode: 0, signal: null });
      stateManager.transitionTo('streams-closing', { completedStreams: ['stdout'] });

      const success = stateManager.transitionTo('fully-terminated', {
        completedStreams: ['stdout', 'stderr', 'stdin'],
        finalTimestamp: Date.now(),
      });

      expect(success).toBe(true);
      expect(stateManager.getStatus().current).toBe('fully-terminated');
      expect(stateManager.isFullyTerminated()).toBe(true);
      expect(onFullyTerminated).toHaveBeenCalledWith({
        processId: 'test-process-123',
        finalState: expect.objectContaining({
          current: 'fully-terminated',
        }),
        timestamp: expect.any(Number),
      });
    });
  });

  describe('無効な状態遷移', () => {
    it('process-running から fully-terminated への直接遷移は無効', () => {
      const success = stateManager.transitionTo('fully-terminated', {});

      expect(success).toBe(false);
      expect(stateManager.getStatus().current).toBe('process-running');
    });

    it('process-running から streams-closing への直接遷移は無効', () => {
      const success = stateManager.transitionTo('streams-closing', {});

      expect(success).toBe(false);
      expect(stateManager.getStatus().current).toBe('process-running');
    });

    it('process-exited から fully-terminated への直接遷移は無効', () => {
      stateManager.transitionTo('process-exited', { exitCode: 0, signal: null });

      const success = stateManager.transitionTo('fully-terminated', {});

      expect(success).toBe(false);
      expect(stateManager.getStatus().current).toBe('process-exited');
    });

    it('後方への状態遷移は無効', () => {
      stateManager.transitionTo('process-exited', { exitCode: 0, signal: null });

      const success = stateManager.transitionTo('process-running', {});

      expect(success).toBe(false);
      expect(stateManager.getStatus().current).toBe('process-exited');
    });
  });

  describe('ストリーム完了の追跡', () => {
    it('ストリーム完了を記録できる', () => {
      stateManager.markStreamCompleted('stdout');

      const state = stateManager.getStatus();
      expect(state.completedStreams).toContain('stdout');
      expect(stateManager.areStreamsComplete()).toBe(false);
    });

    it('全ストリーム完了時にareStreamsCompleteがtrueになる', () => {
      stateManager.markStreamCompleted('stdout');
      stateManager.markStreamCompleted('stderr');
      stateManager.markStreamCompleted('stdin');

      expect(stateManager.areStreamsComplete()).toBe(true);
      expect(stateManager.getStatus().completedStreams).toEqual(['stdout', 'stderr', 'stdin']);
    });

    it('重複したストリーム完了の記録は無視される', () => {
      stateManager.markStreamCompleted('stdout');
      stateManager.markStreamCompleted('stdout');

      const state = stateManager.getStatus();
      expect(state.completedStreams.filter(s => s === 'stdout')).toHaveLength(1);
    });
  });

  describe('状態履歴', () => {
    it('状態遷移の履歴を記録する', () => {
      stateManager.transitionTo('process-exited', { exitCode: 0, signal: null });
      stateManager.transitionTo('streams-closing', { completedStreams: ['stdout'] });

      const history = stateManager.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].from).toBe('process-running');
      expect(history[0].to).toBe('process-exited');
      expect(history[1].from).toBe('process-exited');
      expect(history[1].to).toBe('streams-closing');
    });

    it('履歴には遷移時のメタデータが含まれる', () => {
      const metadata = { exitCode: 1, signal: 'SIGTERM' };
      stateManager.transitionTo('process-exited', metadata);

      const history = stateManager.getHistory();
      expect(history[0].metadata).toEqual(metadata);
      expect(history[0].timestamp).toBeTypeOf('number');
    });
  });

  describe('タイムアウト管理', () => {
    it('状態タイムアウトを設定できる', () => {
      const onTimeout = vi.fn();
      vi.useFakeTimers();

      stateManager.setStateTimeout('process-exited', 5000, onTimeout);
      stateManager.transitionTo('process-exited', { exitCode: 0, signal: null });

      vi.advanceTimersByTime(5000);

      expect(onTimeout).toHaveBeenCalledWith({
        state: 'process-exited',
        processId: 'test-process-123',
        duration: 5000,
        timestamp: expect.any(Number),
      });

      vi.useRealTimers();
    });

    it('状態遷移時にタイムアウトがクリアされる', () => {
      const onTimeout = vi.fn();
      vi.useFakeTimers();

      stateManager.setStateTimeout('process-exited', 5000, onTimeout);
      stateManager.transitionTo('process-exited', { exitCode: 0, signal: null });
      stateManager.transitionTo('streams-closing', { completedStreams: ['stdout'] });

      vi.advanceTimersByTime(5000);

      expect(onTimeout).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('自動状態遷移', () => {
    it('プロセス終了後に全ストリーム完了で自動的にfully-terminatedに遷移', () => {
      const onFullyTerminated = vi.fn();
      stateManager = createTerminationStateManager({
        processId: 'test-process-123',
        onStateChange: vi.fn(),
        onFullyTerminated,
        autoTransition: true,
      });

      // プロセス終了
      stateManager.transitionTo('process-exited', { exitCode: 0, signal: null });

      // ストリーム完了
      stateManager.markStreamCompleted('stdout');
      stateManager.markStreamCompleted('stderr');
      stateManager.markStreamCompleted('stdin');

      expect(stateManager.getStatus().current).toBe('fully-terminated');
      expect(onFullyTerminated).toHaveBeenCalled();
    });

    it('autoTransitionがfalseの場合は自動遷移しない', () => {
      stateManager = createTerminationStateManager({
        processId: 'test-process-123',
        onStateChange: vi.fn(),
        onFullyTerminated: vi.fn(),
        autoTransition: false,
      });

      stateManager.transitionTo('process-exited', { exitCode: 0, signal: null });
      stateManager.markStreamCompleted('stdout');
      stateManager.markStreamCompleted('stderr');
      stateManager.markStreamCompleted('stdin');

      expect(stateManager.getStatus().current).toBe('process-exited');
    });
  });

  describe('リソース管理', () => {
    it('destroyメソッドで全てのタイマーがクリアされる', () => {
      const onTimeout = vi.fn();
      vi.useFakeTimers();

      stateManager.setStateTimeout('process-exited', 5000, onTimeout);
      stateManager.transitionTo('process-exited', { exitCode: 0, signal: null });
      stateManager.destroy();

      vi.advanceTimersByTime(5000);

      expect(onTimeout).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
