import { ChildProcess } from 'child_process';

export interface QProcessSession {
  sessionId: string;
  process: ChildProcess;
  workingDir: string;
  startTime: number;
  status: 'starting' | 'running' | 'completed' | 'error' | 'aborted' | 'terminated';
  lastActivity: number;
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
  lastInfoMessageTime: number;
  // グローバルThinking状態管理
  isThinkingActive: boolean;
  lastThinkingTime: number;
  // 初期化メッセージバッファリング
  initializationBuffer: string[];
  initializationPhase: boolean;
  initializationTimeout?: NodeJS.Timeout;
}

export interface QProcessOptions {
  workingDir: string;
  model?: string;
  resume?: boolean;
  timeout?: number;
}

export interface CLICheckResult {
  available: boolean;
  path?: string;
  error?: string;
}

export interface PathValidationResult {
  valid: boolean;
  error?: string;
  normalizedPath?: string;
}

export interface SessionStats {
  sessionId: string;
  pid?: number;
  status: string;
  runtime: number;
  memoryUsage?: number;
  cpuUsage?: number;
  workingDir: string;
  command: string;
  startTime: number;
  lastActivity: number;
  isActive: boolean;
}

export type MessageType = 'info' | 'error' | 'skip';
export type InfoMessageType = 'initialization' | 'status' | 'progress' | 'general';