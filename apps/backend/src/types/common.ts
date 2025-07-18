/**
 * 共通型定義
 * プロジェクト全体で使用される基本的な型定義
 */

// ID型の定義
export type MessageId = `msg_${string}`;
export type SessionId = `q_session_${string}`;
export type Timestamp = number;

// エラーコード型の定義
export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'AUTHENTICATION_ERROR'
  | 'PROCESS_ERROR'
  | 'WEBSOCKET_ERROR'
  | 'Q_COMMAND_ERROR'
  | 'Q_ABORT_ERROR'
  | 'Q_HISTORY_ERROR'
  | 'Q_HISTORY_UNAVAILABLE'
  | 'Q_HISTORY_DETAILED_ERROR'
  | 'Q_PROJECTS_ERROR'
  | 'Q_PROJECTS_UNAVAILABLE'
  | 'Q_RESUME_ERROR'
  | 'Q_RESUME_UNAVAILABLE'
  | 'Q_RESUME_NO_HISTORY'
  | 'Q_PROJECT_START_ERROR'
  | 'Q_CLI_NOT_AVAILABLE'
  | 'Q_CLI_NOT_FOUND'
  | 'Q_CLI_PERMISSION_ERROR'
  | 'SOCKET_ERROR'
  | 'INTERNAL_ERROR';

// 基本的なレスポンス型
export interface BaseResponse {
  success: boolean;
  message?: string;
  timestamp: Timestamp;
}

// エラーレスポンス型
export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, string | number | boolean | null>;
  };
}

// 成功レスポンス型
export interface SuccessResponse<T = unknown> extends BaseResponse {
  success: true;
  data?: T;
}

// API レスポンス型の統合
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ステータス型の定義
export type ProcessStatus = 'starting' | 'running' | 'completed' | 'error' | 'aborted' | 'terminated';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting';

// ファイルパス型の定義
export type AbsolutePath = string; // 絶対パス
export type RelativePath = string; // 相対パス
export type FilePath = AbsolutePath | RelativePath;

// 型ガード関数
export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return !response.success;
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success;
}

export function isMessageId(id: string): id is MessageId {
  return id.startsWith('msg_');
}

export function isSessionId(id: string): id is SessionId {
  return id.startsWith('q_session_');
}