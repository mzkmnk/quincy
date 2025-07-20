import {
  type ProcessLike,
  type StreamName,
  type BaseEvent,
  type ProcessExitEvent,
  type ErrorEvent,
  type TimeoutEvent,
  type Destroyable,
  type StatusProvider,
} from './types';
import { createStdioMonitor, type StdioMonitor } from './stdio-monitor';

/**
 * enhanced process termination のオプション設定
 */
export interface EnhancedProcessTerminationOptions {
  onProcessExited?: (event: ProcessExitedEvent) => void;
  onStreamsClosed?: (event: StreamsClosedEvent) => void;
  onFullyTerminated?: (event: FullyTerminatedEvent) => void;
  onStreamEnded?: (event: StreamEndedEvent) => void;
  onTimeout?: (event: EnhancedTimeoutEvent) => void;
  onError?: (event: EnhancedErrorEvent) => void;
  timeout: number;
}

/**
 * プロセス終了イベント
 */
export type ProcessExitedEvent = ProcessExitEvent;

/**
 * ストリーム終了イベント
 */
export interface StreamsClosedEvent extends BaseEvent {
  completedStreams: StreamName[];
}

/**
 * 完全終了イベント
 */
export interface FullyTerminatedEvent extends ProcessExitEvent {
  completedStreams: StreamName[];
  terminationState: string;
  duration: number;
}

/**
 * 個別ストリーム終了イベント
 */
export interface StreamEndedEvent extends BaseEvent {
  stream: StreamName;
  completedStreams: StreamName[];
}

/**
 * enhanced termination 専用タイムアウトイベント
 */
export interface EnhancedTimeoutEvent extends TimeoutEvent {
  reason: 'streams-incomplete' | 'process-not-exited';
}

/**
 * enhanced termination 専用エラーイベント
 */
export type EnhancedErrorEvent = ErrorEvent;

/**
 * プロセス終了状態
 */
export interface ProcessTerminationStatus {
  isProcessExited: boolean;
  areStreamsComplete: boolean;
  isFullyTerminated: boolean;
  completedStreams: StreamName[];
  exitCode?: number | null;
  signal?: string | null;
}

/**
 * enhanced process termination のインターフェース
 */
export interface EnhancedProcessTermination
  extends Destroyable,
    StatusProvider<ProcessTerminationStatus> {}

/**
 * プロセス終了とストリーム終了を統合検出する高度な終了監視システムを作成
 *
 * @param process - 監視対象のプロセス
 * @param options - 監視オプション
 * @returns EnhancedProcessTermination インスタンス
 */
export function createEnhancedProcessTermination(
  process: ProcessLike,
  options: EnhancedProcessTerminationOptions
): EnhancedProcessTermination {
  // パフォーマンス最適化: 状態管理の軽量化
  let processExitData: { exitCode: number | null; signal: string | null } | null = null;
  let processExitEventFired = false;
  let stdioMonitor: StdioMonitor | null = null;
  let timeoutTimer: NodeJS.Timeout | null = null;
  let isDestroyed = false;

  const startTime = Date.now();

  /**
   * タイマーのクリーンアップ
   */
  function cleanup(): void {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  }

  /**
   * 完全終了チェックと通知
   * パフォーマンス最適化: 早期リターンと条件チェック最適化
   */
  function checkFullyTerminated(): void {
    if (isDestroyed || !processExitData) return;

    const status = stdioMonitor?.getStatus();
    if (status?.isComplete) {
      cleanup();

      options.onFullyTerminated?.({
        processId: process.pid,
        exitCode: processExitData.exitCode,
        signal: processExitData.signal,
        completedStreams: status.completedStreams,
        terminationState: 'fully-terminated',
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      });
    }
  }

  /**
   * プロセス終了の処理
   * パフォーマンス最適化: 重複処理防止と早期リターン
   */
  function handleProcessExit(exitCode: number | null, signal: string | null): void {
    if (processExitEventFired || isDestroyed) return;

    processExitEventFired = true;
    processExitData = { exitCode, signal };

    options.onProcessExited?.({
      processId: process.pid,
      exitCode,
      signal,
      timestamp: Date.now(),
    });

    checkFullyTerminated();
  }

  /**
   * タイムアウト監視の開始
   */
  function startTimeoutTimer(): void {
    if (options.timeout <= 0) return;

    timeoutTimer = setTimeout(() => {
      if (isDestroyed) return;

      const status = stdioMonitor?.getStatus();
      const reason: EnhancedTimeoutEvent['reason'] = !processExitData
        ? 'process-not-exited'
        : 'streams-incomplete';

      options.onTimeout?.({
        processId: process.pid,
        reason,
        completedStreams: status?.completedStreams || [],
        pendingStreams: status?.pendingStreams || [],
        timeout: options.timeout,
        timestamp: Date.now(),
      });
    }, options.timeout);
  }

  // stdio monitor の初期化（効率的なコールバック設定）
  stdioMonitor = createStdioMonitor(process, {
    onStdoutEnd: event => {
      if (isDestroyed) return;
      const status = stdioMonitor!.getStatus();
      options.onStreamEnded?.({
        processId: process.pid,
        stream: 'stdout',
        completedStreams: status.completedStreams,
        timestamp: event.timestamp,
      });
    },

    onStderrEnd: event => {
      if (isDestroyed) return;
      const status = stdioMonitor!.getStatus();
      options.onStreamEnded?.({
        processId: process.pid,
        stream: 'stderr',
        completedStreams: status.completedStreams,
        timestamp: event.timestamp,
      });
    },

    onStdinFinish: event => {
      if (isDestroyed) return;
      const status = stdioMonitor!.getStatus();
      options.onStreamEnded?.({
        processId: process.pid,
        stream: 'stdin',
        completedStreams: status.completedStreams,
        timestamp: event.timestamp,
      });
    },

    onAllStreamsClosed: event => {
      if (isDestroyed) return;

      options.onStreamsClosed?.({
        processId: process.pid,
        completedStreams: event.completedStreams,
        timestamp: event.timestamp,
      });

      checkFullyTerminated();
    },

    onError: event => {
      if (isDestroyed) return;

      options.onError?.({
        processId: process.pid,
        error: event.error,
        source: event.stream,
        timestamp: event.timestamp,
      });
    },

    timeout: 0, // stdio monitor ではタイムアウトを使わない（統合レベルで管理）
  });

  // プロセスイベントリスナーの定義（メモリ効率のため事前定義）
  const exitListener = (exitCode: number | null, signal: string | null) => {
    handleProcessExit(exitCode, signal);
  };

  const closeListener = (exitCode: number | null, signal: string | null) => {
    // exitイベントが発生していない場合のみ処理（重複防止）
    if (!processExitEventFired) {
      handleProcessExit(exitCode, signal);
    }
  };

  const errorListener = (error: Error) => {
    if (isDestroyed) return;

    options.onError?.({
      processId: process.pid,
      error,
      source: 'process',
      timestamp: Date.now(),
    });
  };

  // イベントリスナーの登録
  process.on('exit', exitListener);
  process.on('close', closeListener);
  process.on('error', errorListener);

  // タイムアウト監視開始
  startTimeoutTimer();

  return {
    /**
     * 現在の終了状態を取得
     * パフォーマンス最適化: 必要な時のみ状態を計算
     */
    getStatus(): ProcessTerminationStatus {
      const stdioStatus = stdioMonitor?.getStatus();

      return {
        isProcessExited: processExitEventFired,
        areStreamsComplete: stdioStatus?.isComplete ?? false,
        isFullyTerminated: processExitEventFired && (stdioStatus?.isComplete ?? false),
        completedStreams: stdioStatus?.completedStreams ?? [],
        exitCode: processExitData?.exitCode,
        signal: processExitData?.signal,
      };
    },

    /**
     * 全リソースのクリーンアップ
     * パフォーマンス最適化: 効率的なリソース解放
     */
    destroy(): void {
      if (isDestroyed) return;

      isDestroyed = true;
      cleanup();

      // プロセスリスナーを削除
      process.removeListener('exit', exitListener);
      process.removeListener('close', closeListener);
      process.removeListener('error', errorListener);

      // stdio monitor を破棄
      stdioMonitor?.destroy();
      stdioMonitor = null;
    },
  };
}
