/**
 * WebSocket関連の型定義
 */

import { SessionId, MessageId, ErrorCode } from './common.types';

// WebSocket接続状態
export type WebSocketConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// WebSocketイベント型
export type WebSocketEventType =
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'q_response'
  | 'q_error'
  | 'q_info'
  | 'q_completion'
  | 'session_started'
  | 'session_failed'
  | 'project_history'
  | 'all_projects_history'
  | 'project_history_detailed';

// WebSocketメッセージ基底型
export interface BaseWebSocketMessage {
  type: WebSocketEventType;
  timestamp: Date;
  sessionId?: SessionId;
}

// WebSocket接続状態管理
export interface WebSocketConnectionStatus {
  state: WebSocketConnectionState;
  connected: boolean;
  connecting: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

// WebSocketエラーメッセージ
export interface WebSocketErrorMessage extends BaseWebSocketMessage {
  type: 'error';
  error: string;
  errorCode?: ErrorCode;
}

// Amazon Q関連のWebSocketメッセージ
export interface QResponseMessage extends BaseWebSocketMessage {
  type: 'q_response';
  sessionId: SessionId;
  data: string;
  messageId?: MessageId;
}

export interface QErrorMessage extends BaseWebSocketMessage {
  type: 'q_error';
  sessionId: SessionId;
  error: string;
  errorCode?: ErrorCode;
}

export interface QInfoMessage extends BaseWebSocketMessage {
  type: 'q_info';
  sessionId: SessionId;
  message: string;
  infoType?: 'initialization' | 'status' | 'progress' | 'general';
}

export interface QCompletionMessage extends BaseWebSocketMessage {
  type: 'q_completion';
  sessionId: SessionId;
  success: boolean;
  totalTokens?: number;
  completionTime?: number;
}

// セッション関連のWebSocketメッセージ
export interface SessionStartedMessage extends BaseWebSocketMessage {
  type: 'session_started';
  sessionId: SessionId;
  projectPath: string;
  projectName: string;
}

export interface SessionFailedMessage extends BaseWebSocketMessage {
  type: 'session_failed';
  error: string;
  errorCode?: ErrorCode;
  projectPath?: string;
}

// WebSocketメッセージのユニオン型
export type WebSocketMessage =
  | WebSocketErrorMessage
  | QResponseMessage
  | QErrorMessage
  | QInfoMessage
  | QCompletionMessage
  | SessionStartedMessage
  | SessionFailedMessage;

// WebSocketイベントリスナー型
export type WebSocketEventListener<T extends WebSocketMessage = WebSocketMessage> = (
  message: T
) => void;

// WebSocketサービスインターフェース
export interface IWebSocketService {
  connect(): void;
  disconnect(): void;
  connected(): boolean;
  connecting(): boolean;
  emit(event: string, data: unknown): void;
  on<T extends WebSocketMessage>(
    event: WebSocketEventType,
    listener: WebSocketEventListener<T>
  ): void;
  off(event: WebSocketEventType, listener?: WebSocketEventListener): void;
  removeAllListeners(event?: WebSocketEventType): void;
}

// 型ガード関数
export function isWebSocketMessage(data: unknown): data is WebSocketMessage {
  return typeof data === 'object' && data !== null && 'type' in data;
}

export function isQResponseMessage(message: WebSocketMessage): message is QResponseMessage {
  return message.type === 'q_response';
}

export function isQErrorMessage(message: WebSocketMessage): message is QErrorMessage {
  return message.type === 'q_error';
}

export function isQInfoMessage(message: WebSocketMessage): message is QInfoMessage {
  return message.type === 'q_info';
}

export function isQCompletionMessage(message: WebSocketMessage): message is QCompletionMessage {
  return message.type === 'q_completion';
}

export function isSessionStartedMessage(
  message: WebSocketMessage
): message is SessionStartedMessage {
  return message.type === 'session_started';
}

export function isSessionFailedMessage(message: WebSocketMessage): message is SessionFailedMessage {
  return message.type === 'session_failed';
}
