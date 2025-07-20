import {
  type TerminationState,
  type StateTransitionEvent,
  type StreamName,
  type Destroyable,
  type StatusProvider,
} from './types';

/**
 * 状態遷移イベント（state manager専用）
 */
export type TerminationStateTransition = StateTransitionEvent;

/**
 * 状態情報
 */
export interface TerminationStateInfo {
  current: TerminationState;
  processId: string;
  timestamp: number;
  completedStreams: StreamName[];
  metadata?: Record<string, unknown>;
}

/**
 * state manager のオプション
 */
export interface TerminationStateManagerOptions {
  processId: string;
  onStateChange?: (transition: TerminationStateTransition) => void;
  onFullyTerminated?: (event: FullyTerminatedEvent) => void;
  autoTransition?: boolean;
}

/**
 * 完全終了イベント
 */
export interface FullyTerminatedEvent {
  processId: string;
  finalState: TerminationStateInfo;
  timestamp: number;
}

/**
 * 状態タイムアウトイベント
 */
export interface StateTimeoutEvent {
  state: TerminationState;
  processId: string;
  duration: number;
  timestamp: number;
}

/**
 * state manager のインターフェース
 */
export interface TerminationStateManager extends Destroyable, StatusProvider<TerminationStateInfo> {
  transitionTo(state: TerminationState, metadata?: Record<string, unknown>): boolean;
  markStreamCompleted(stream: StreamName): void;
  isFullyTerminated(): boolean;
  isProcessExited(): boolean;
  areStreamsComplete(): boolean;
  getHistory(): TerminationStateTransition[];
  setStateTimeout(
    state: TerminationState,
    timeout: number,
    callback: (event: StateTimeoutEvent) => void
  ): void;
}

/**
 * 有効な状態遷移のマップ（パフォーマンス最適化: constアサーションで最適化）
 */
const VALID_TRANSITIONS: Record<TerminationState, readonly TerminationState[]> = {
  'process-running': ['process-exited'],
  'process-exited': ['streams-closing'],
  'streams-closing': ['fully-terminated'],
  'fully-terminated': [],
} as const;

/**
 * 必要なストリーム数（パフォーマンス最適化: 定数として定義）
 */
const REQUIRED_STREAM_COUNT = 3; // stdout, stderr, stdin

/**
 * プロセス終了検出の段階的状態管理システムを作成
 *
 * @param options - state manager のオプション
 * @returns TerminationStateManager インスタンス
 */
export function createTerminationStateManager(
  options: TerminationStateManagerOptions
): TerminationStateManager {
  let currentState: TerminationStateInfo = {
    current: 'process-running',
    processId: options.processId,
    timestamp: Date.now(),
    completedStreams: [],
  };

  const history: TerminationStateTransition[] = [];
  const completedStreams = new Set<StreamName>();
  const stateTimeouts = new Map<TerminationState, NodeJS.Timeout>();
  let isDestroyed = false;

  /**
   * 指定した状態のタイムアウトをクリア
   */
  function clearStateTimeout(state: TerminationState): void {
    const timeout = stateTimeouts.get(state);
    if (timeout) {
      clearTimeout(timeout);
      stateTimeouts.delete(state);
    }
  }

  /**
   * 全てのタイムアウトをクリア（メモリリーク防止）
   */
  function clearAllTimeouts(): void {
    for (const timeout of stateTimeouts.values()) {
      clearTimeout(timeout);
    }
    stateTimeouts.clear();
  }

  /**
   * 自動状態遷移のチェック
   * パフォーマンス最適化: 早期リターンで不要な処理を回避
   */
  function checkAutoTransition(): void {
    if (!options.autoTransition || isDestroyed) return;

    const isStreamsComplete = completedStreams.size >= REQUIRED_STREAM_COUNT;

    // プロセス終了後に全ストリームが完了した場合の自動遷移
    if (currentState.current === 'process-exited' && isStreamsComplete) {
      // streams-closingを経由してfully-terminatedに遷移
      transitionTo('streams-closing', {
        completedStreams: Array.from(completedStreams),
      });
      // 即座にfully-terminatedに遷移
      transitionTo('fully-terminated', {
        completedStreams: Array.from(completedStreams),
        finalTimestamp: Date.now(),
      });
      return;
    }

    // streams-closing状態で全ストリーム完了時の自動遷移
    if (currentState.current === 'streams-closing' && isStreamsComplete) {
      transitionTo('fully-terminated', {
        completedStreams: Array.from(completedStreams),
        finalTimestamp: Date.now(),
      });
      return;
    }
  }

  /**
   * 状態遷移の実行
   * パフォーマンス最適化: バリデーションの高速化と早期リターン
   */
  function transitionTo(newState: TerminationState, metadata?: Record<string, unknown>): boolean {
    if (isDestroyed) return false;

    // バリデーション: 有効な遷移かチェック
    const validNextStates = VALID_TRANSITIONS[currentState.current];
    if (!validNextStates.includes(newState)) {
      return false;
    }

    const previousState = currentState.current;
    const timestamp = Date.now();

    // 状態遷移の記録
    const transition: TerminationStateTransition = {
      from: previousState,
      to: newState,
      processId: options.processId,
      metadata,
      timestamp,
    };

    history.push(transition);

    // 状態更新（効率的な更新）
    currentState = {
      current: newState,
      processId: options.processId,
      timestamp,
      completedStreams: Array.from(completedStreams),
      metadata,
    };

    // 前の状態のタイムアウトをクリア
    clearStateTimeout(previousState);

    // コールバック呼び出し（オプショナルチェーンで最適化）
    if (!isDestroyed) {
      options.onStateChange?.(transition);

      // 完全終了時の特別処理
      if (newState === 'fully-terminated') {
        options.onFullyTerminated?.({
          processId: options.processId,
          finalState: currentState,
          timestamp,
        });
      }
    }

    return true;
  }

  /**
   * ストリーム完了のマーク
   * パフォーマンス最適化: Set操作と早期リターン
   */
  function markStreamCompleted(stream: StreamName): void {
    if (isDestroyed || completedStreams.has(stream)) return;

    completedStreams.add(stream);
    currentState.completedStreams = Array.from(completedStreams);

    checkAutoTransition();
  }

  /**
   * 全ストリーム完了チェック（高速化）
   */
  function areStreamsComplete(): boolean {
    return completedStreams.size >= REQUIRED_STREAM_COUNT;
  }

  /**
   * プロセス終了チェック（配列操作の最適化）
   */
  function isProcessExited(): boolean {
    return currentState.current !== 'process-running';
  }

  /**
   * 完全終了チェック
   */
  function isFullyTerminated(): boolean {
    return currentState.current === 'fully-terminated';
  }

  /**
   * 状態タイムアウトの設定
   */
  function setStateTimeout(
    state: TerminationState,
    timeout: number,
    callback: (event: StateTimeoutEvent) => void
  ): void {
    if (isDestroyed) return;

    clearStateTimeout(state);

    const timer = setTimeout(() => {
      if (!isDestroyed && currentState.current === state) {
        callback({
          state,
          processId: options.processId,
          duration: timeout,
          timestamp: Date.now(),
        });
      }
    }, timeout);

    stateTimeouts.set(state, timer);
  }

  return {
    /**
     * 現在の状態を取得（防御的コピー）
     */
    getStatus(): TerminationStateInfo {
      return { ...currentState };
    },

    transitionTo,
    markStreamCompleted,
    isFullyTerminated,
    isProcessExited,
    areStreamsComplete,

    /**
     * 状態遷移履歴を取得（防御的コピー）
     */
    getHistory(): TerminationStateTransition[] {
      return [...history];
    },

    setStateTimeout,

    /**
     * リソースクリーンアップ
     */
    destroy(): void {
      if (isDestroyed) return;

      isDestroyed = true;
      clearAllTimeouts();
    },
  };
}
