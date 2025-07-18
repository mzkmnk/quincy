/**
 * 共通型定義
 */

// 基本的な識別子型
export type MessageId = string;
export type SessionId = string;
export type ProjectId = string;
export type ConversationId = string;

// タイムスタンプ型
export type Timestamp = Date;

// エラーコード型
export type ErrorCode = 
  | 'Q_CLI_NOT_AVAILABLE'
  | 'Q_CLI_NOT_FOUND'
  | 'Q_CLI_PERMISSION_ERROR'
  | 'Q_CLI_SPAWN_ERROR'
  | 'SESSION_TIMEOUT'
  | 'WEBSOCKET_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

// 共通レスポンス型
export interface BaseResponse {
  success: boolean;
  error?: string;
  errorCode?: ErrorCode;
}

// ページネーション型
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 型ガード関数
export function isValidMessageId(id: unknown): id is MessageId {
  return typeof id === 'string' && id.length > 0;
}

export function isValidSessionId(id: unknown): id is SessionId {
  return typeof id === 'string' && id.length > 0;
}

export function isValidProjectId(id: unknown): id is ProjectId {
  return typeof id === 'string' && id.length > 0;
}

export function isValidConversationId(id: unknown): id is ConversationId {
  return typeof id === 'string' && id.length > 0;
}

export function isValidTimestamp(timestamp: unknown): timestamp is Timestamp {
  return timestamp instanceof Date && !isNaN(timestamp.getTime());
}

export function isValidErrorCode(code: unknown): code is ErrorCode {
  return typeof code === 'string' && [
    'Q_CLI_NOT_AVAILABLE',
    'Q_CLI_NOT_FOUND', 
    'Q_CLI_PERMISSION_ERROR',
    'Q_CLI_SPAWN_ERROR',
    'SESSION_TIMEOUT',
    'WEBSOCKET_ERROR',
    'VALIDATION_ERROR',
    'UNKNOWN_ERROR'
  ].includes(code);
}