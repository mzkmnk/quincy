/**
 * Amazon Q関連の型定義
 * Amazon Q CLIサービスで使用される型定義の統合
 */

import { ChildProcess } from 'child_process';
import { SessionId, ProcessStatus, AbsolutePath, Timestamp } from './common';

// Amazon Q プロセスセッション型
export interface QProcessSession {
  sessionId: SessionId;
  process: ChildProcess;
  workingDir: AbsolutePath;
  startTime: Timestamp;
  status: ProcessStatus;
  lastActivity: Timestamp;
  pid?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  command: string;
  options: QProcessOptions;
  // レスポンスバッファリング用
  outputBuffer: string;
  errorBuffer: string;
  bufferTimeout?: NodeJS.Timeout;
  bufferFlushCount: number;
  // 行ベースバッファリング用
  incompleteOutputLine: string;
  incompleteErrorLine: string;
  // 重複メッセージ防止用
  lastInfoMessage: string;
  lastInfoMessageTime: Timestamp;
  // グローバルThinking状態管理
  isThinkingActive: boolean;
  lastThinkingTime: Timestamp;
  // 初期化メッセージバッファリング
  initializationBuffer: string[];
  initializationPhase: boolean;
  initializationTimeout?: NodeJS.Timeout;
}

// Amazon Q プロセスオプション型
export interface QProcessOptions {
  workingDir: AbsolutePath;
  model?: string;
  resume?: boolean;
  timeout?: number;
}

// Amazon Q セッション統計型
export interface QSessionStats {
  sessionId: SessionId;
  runtime: number; // ミリ秒
  memoryUsage: number; // MB
  cpuUsage: number; // パーセント
  startTime: Timestamp;
  lastActivity: Timestamp;
  status: ProcessStatus;
}

// Amazon Q コマンドイベント型
export interface QCommandEventData {
  command: string;
  workingDir: AbsolutePath;
  model?: string;
  resume?: boolean;
}

// Amazon Q アボートイベント型
export interface QAbortEventData {
  sessionId: SessionId;
  reason?: string;
}

// Amazon Q メッセージイベント型
export interface QMessageEventData {
  sessionId: SessionId;
  message: string;
}

// Amazon Q レスポンスイベント型
export interface QResponseEventData {
  sessionId: SessionId;
  content: string;
  type: 'stdout' | 'stderr' | 'info' | 'error' | 'complete';
  timestamp: Timestamp;
}

// Amazon Q エラーイベント型
export interface QErrorEventData {
  sessionId: SessionId;
  error: string;
  code?: string;
  timestamp: Timestamp;
}

// Amazon Q 情報イベント型
export interface QInfoEventData {
  sessionId: SessionId;
  info: string;
  type: 'thinking' | 'initialization' | 'system' | 'general';
  timestamp: Timestamp;
}

// Amazon Q 完了イベント型
export interface QCompleteEventData {
  sessionId: SessionId;
  exitCode: number;
  timestamp: Timestamp;
}

// Amazon Q セッション開始イベント型
export interface QSessionStartedEventData {
  sessionId: SessionId;
  projectPath: AbsolutePath;
  model?: string;
}

// Amazon Q プロジェクト開始イベント型
export interface QProjectStartEventData {
  projectPath: AbsolutePath;
  resume?: boolean;
}

// CLI 可用性チェック結果型
export interface CLIAvailabilityResult {
  available: boolean;
  cliPath?: string;
  version?: string;
  error?: string;
}

// セッション作成レスポンス型
export interface SessionCreatedResponse {
  sessionId: SessionId;
  projectId: string;
}

// メッセージ分類型
export type MessageClassification = 
  | 'error'
  | 'info'
  | 'warning'
  | 'debug'
  | 'thinking'
  | 'initialization'
  | 'output'
  | 'ignore';

// 情報メッセージタイプ型
export type InfoMessageType = 
  | 'thinking'
  | 'initialization'
  | 'system'
  | 'general'
  | 'other';

// 型ガード関数
export function isQProcessSession(obj: unknown): obj is QProcessSession {
  return typeof obj === 'object' && obj !== null && 'sessionId' in obj && 'process' in obj;
}

export function isValidSessionId(sessionId: string): sessionId is SessionId {
  return sessionId.startsWith('q_session_');
}

export function isValidProcessStatus(status: string): status is ProcessStatus {
  return ['starting', 'running', 'completed', 'error', 'aborted', 'terminated'].includes(status);
}