import {
  type ProcessLike,
  type StreamName,
  type BaseEvent,
  type StreamEvent,
  type ErrorEvent,
  type TimeoutEvent,
  type Destroyable,
  type StatusProvider,
} from './types';

/**
 * stdio monitor のオプション設定
 */
export interface StdioMonitorOptions {
  onStdoutEnd?: (event: StreamEndEvent) => void;
  onStderrEnd?: (event: StreamEndEvent) => void;
  onStdinFinish?: (event: StreamEndEvent) => void;
  onAllStreamsClosed?: (event: AllStreamsClosedEvent) => void;
  onTimeout?: (event: StdioTimeoutEvent) => void;
  onError?: (event: StdioErrorEvent) => void;
  timeout: number;
}

/**
 * ストリーム終了イベント
 */
export type StreamEndEvent = StreamEvent;

/**
 * 全ストリーム終了イベント
 */
export interface AllStreamsClosedEvent extends BaseEvent {
  completedStreams: StreamName[];
}

/**
 * stdio monitor 専用タイムアウトイベント
 */
export type StdioTimeoutEvent = TimeoutEvent;

/**
 * stdio monitor 専用エラーイベント
 */
export interface StdioErrorEvent extends ErrorEvent {
  stream: StreamName;
}

/**
 * stdio monitor の状態
 */
export interface StdioMonitorStatus {
  completedStreams: StreamName[];
  pendingStreams: StreamName[];
  isComplete: boolean;
}

/**
 * stdio monitor のインターフェース
 */
export interface StdioMonitor extends Destroyable, StatusProvider<StdioMonitorStatus> {}

/**
 * stdio streams の個別監視と統合終了検出を行うモニターを作成
 *
 * @param process - 監視対象のプロセス
 * @param options - 監視オプション
 * @returns StdioMonitor インスタンス
 */
export function createStdioMonitor(
  process: ProcessLike,
  options: StdioMonitorOptions
): StdioMonitor {
  // パフォーマンス最適化: 配列の代わりにSetを使用
  const completedStreams = new Set<StreamName>();
  const streamNames: readonly StreamName[] = ['stdout', 'stderr', 'stdin'] as const;
  let timeoutTimer: NodeJS.Timeout | null = null;
  let isDestroyed = false;

  /**
   * タイマーのクリーンアップ
   */
  function cleanup() {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  }

  /**
   * 全ストリーム完了チェック
   */
  function checkAllStreamsComplete() {
    if (completedStreams.size === streamNames.length) {
      cleanup();
      if (!isDestroyed) {
        options.onAllStreamsClosed?.({
          processId: process.pid,
          completedStreams: Array.from(completedStreams),
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * ストリーム終了の処理
   * パフォーマンス最適化: 早期リターンとコールバック最適化
   */
  function handleStreamEnd(streamName: StreamName) {
    // 重複処理の防止
    if (completedStreams.has(streamName) || isDestroyed) {
      return;
    }

    completedStreams.add(streamName);
    const timestamp = Date.now();
    const event: StreamEndEvent = {
      processId: process.pid,
      stream: streamName,
      timestamp,
    };

    // コールバック呼び出しの最適化
    switch (streamName) {
      case 'stdout':
        options.onStdoutEnd?.(event);
        break;
      case 'stderr':
        options.onStderrEnd?.(event);
        break;
      case 'stdin':
        options.onStdinFinish?.(event);
        break;
    }

    checkAllStreamsComplete();
  }

  /**
   * ストリームエラーの処理
   */
  function handleStreamError(streamName: StreamName, error: Error) {
    if (isDestroyed) return;

    options.onError?.({
      processId: process.pid,
      error,
      stream: streamName,
      source: streamName,
      timestamp: Date.now(),
    });
  }

  /**
   * タイムアウト監視の開始
   */
  function startTimeout() {
    if (options.timeout > 0) {
      timeoutTimer = setTimeout(() => {
        if (!isDestroyed && completedStreams.size < streamNames.length) {
          const pending = streamNames.filter(name => !completedStreams.has(name));
          options.onTimeout?.({
            processId: process.pid,
            completedStreams: Array.from(completedStreams),
            pendingStreams: pending,
            timeout: options.timeout,
            reason: 'streams-incomplete',
            timestamp: Date.now(),
          });
        }
      }, options.timeout);
    }
  }

  // イベントリスナーの定義（メモリ効率のため関数を事前定義）
  const stdoutEndListener = () => handleStreamEnd('stdout');
  const stderrEndListener = () => handleStreamEnd('stderr');
  const stdinFinishListener = () => handleStreamEnd('stdin');

  const stdoutErrorListener = (error: Error) => handleStreamError('stdout', error);
  const stderrErrorListener = (error: Error) => handleStreamError('stderr', error);
  const stdinErrorListener = (error: Error) => handleStreamError('stdin', error);

  // リスナーの登録
  process.stdout.on('end', stdoutEndListener);
  process.stderr.on('end', stderrEndListener);
  process.stdin.on('finish', stdinFinishListener);

  process.stdout.on('error', stdoutErrorListener);
  process.stderr.on('error', stderrErrorListener);
  process.stdin.on('error', stdinErrorListener);

  // タイムアウト監視開始
  startTimeout();

  return {
    /**
     * リソースのクリーンアップと全リスナーの削除
     */
    destroy() {
      if (isDestroyed) return;

      isDestroyed = true;
      cleanup();

      // 全リスナーを削除
      process.stdout.removeListener('end', stdoutEndListener);
      process.stderr.removeListener('end', stderrEndListener);
      process.stdin.removeListener('finish', stdinFinishListener);

      process.stdout.removeListener('error', stdoutErrorListener);
      process.stderr.removeListener('error', stderrErrorListener);
      process.stdin.removeListener('error', stdinErrorListener);
    },

    /**
     * 現在の監視状態を取得
     * パフォーマンス最適化: 必要な時のみ配列を作成
     */
    getStatus(): StdioMonitorStatus {
      const completedArray = Array.from(completedStreams);
      const pendingArray = streamNames.filter(name => !completedStreams.has(name));

      return {
        completedStreams: completedArray,
        pendingStreams: pendingArray,
        isComplete: completedStreams.size === streamNames.length,
      };
    },
  };
}
