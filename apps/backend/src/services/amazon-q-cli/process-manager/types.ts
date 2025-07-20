import { EventEmitter } from 'events';

/**
 * プロセスライクオブジェクトの型定義
 * Node.js ChildProcessやそれに類するオブジェクトを表現
 */
export interface ProcessLike extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: EventEmitter;
  pid: number;
  exitCode?: number | null;
  signalCode?: string | null;
}

/**
 * ストリーム名の型定義
 */
export type StreamName = 'stdout' | 'stderr' | 'stdin';

/**
 * プロセス終了検出の段階的状態
 */
export type TerminationState =
  | 'process-running'
  | 'process-exited'
  | 'streams-closing'
  | 'fully-terminated';

/**
 * 基本的なイベントの共通プロパティ
 */
export interface BaseEvent {
  processId: number;
  timestamp: number;
}

/**
 * ストリーム関連のイベント
 */
export interface StreamEvent extends BaseEvent {
  stream: StreamName;
}

/**
 * プロセス終了イベント
 */
export interface ProcessExitEvent extends BaseEvent {
  exitCode: number | null;
  signal: string | null;
}

/**
 * エラーイベント
 */
export interface ErrorEvent extends BaseEvent {
  error: Error;
  source: string;
}

/**
 * タイムアウトイベント
 */
export interface TimeoutEvent extends BaseEvent {
  completedStreams: StreamName[];
  pendingStreams: StreamName[];
  timeout: number;
  reason?: string;
}

/**
 * 状態遷移イベント
 */
export interface StateTransitionEvent {
  from: TerminationState;
  to: TerminationState;
  processId: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

/**
 * リソース管理のためのインターフェース
 */
export interface Destroyable {
  destroy(): void;
}

/**
 * 状態照会のためのインターフェース
 */
export interface StatusProvider<T> {
  getStatus(): T;
}
