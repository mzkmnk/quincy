/**
 * WebSocket関連の型定義
 * WebSocketサービスで使用される型定義の統合
 */

import { MessageId, SessionId, Timestamp, ConnectionStatus, ErrorCode } from './common';

// 接続情報型
export interface ConnectionInfo {
  socketId: string;
  sessionId?: SessionId;
  connectedAt: Timestamp;
  status?: ConnectionStatus;
  userId?: string;
  rooms?: string[];
}

// メッセージデータ型
export interface MessageData {
  id: MessageId;
  content: string;
  senderId: string;
  timestamp: Timestamp;
  type: 'text' | 'system' | 'error' | 'info';
  roomId?: string;
}

// メッセージ送信イベント型
export interface MessageSendEventData {
  content: string;
  senderId: string;
  type: 'text' | 'system' | 'error' | 'info';
  roomId?: string;
}

// ルームデータ型
export interface RoomData {
  roomId: string;
  timestamp?: Timestamp;
}

// ルーム参加イベント型
export interface RoomJoinedEventData {
  roomId: string;
  timestamp: Timestamp;
  userId?: string;
}

// ルーム退出イベント型
export interface RoomLeftEventData {
  roomId: string;
  timestamp: Timestamp;
  userId?: string;
}

// エラーデータ型
export interface ErrorData {
  code: ErrorCode;
  message: string;
  details?: Record<string, string | number | boolean | null>;
  timestamp?: Timestamp;
}

// ソケットデータ型（Socket.IOのカスタムデータ）
export interface SocketData {
  rooms: string[];
  sessionId?: SessionId;
  userId?: string;
  connectedAt?: Timestamp;
}

// セッション・ソケットマッピング型
export interface SessionSocketMapping {
  sessionId: SessionId;
  socketIds: Set<string>;
}

// ルーム統計型
export interface RoomStats {
  roomId: string;
  userCount: number;
  users: string[];
  createdAt?: Timestamp;
  lastActivity?: Timestamp;
}

// 接続統計型
export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  rooms: RoomStats[];
  uptime: number;
}

// Conversation関連のイベントデータ型
export interface ConversationReadyEventData {
  sessionId: SessionId;
  conversationId: string;
  projectPath: string;
}

export interface ConversationTranscriptUpdateEventData {
  conversationId: string;
  newMessages: Array<{
    role: 'user' | 'assistant';
    content: Array<{ text: string }>;
  }>;
  totalMessageCount: number;
}

export interface ConversationToolActivityEventData {
  conversationId: string;
  tools: string[];
  message: string;
}

export interface ConversationTimeoutEventData {
  sessionId?: SessionId;
  conversationId?: string;
  error: string;
}

// WebSocketイベント型の統合
export interface WebSocketEvents {
  // 接続関連
  connection: (socketId: string) => void;
  disconnection: (socketId: string, reason?: string) => void;

  // メッセージ関連
  'message:send': (data: MessageSendEventData) => void;
  'message:broadcast': (data: MessageData) => void;
  'message:received': (data: MessageData) => void;

  // ルーム関連
  'room:join': (data: RoomData) => void;
  'room:leave': (data: RoomData) => void;
  'room:joined': (data: RoomJoinedEventData) => void;
  'room:left': (data: RoomLeftEventData) => void;

  // Conversation関連
  'conversation:ready': (data: ConversationReadyEventData) => void;
  'conversation:transcript-update': (data: ConversationTranscriptUpdateEventData) => void;
  'conversation:tool-activity': (data: ConversationToolActivityEventData) => void;
  'conversation:timeout': (data: ConversationTimeoutEventData) => void;

  // システム関連
  ping: () => void;
  pong: () => void;
  error: (data: ErrorData) => void;
}

// WebSocketサービス設定型
export interface WebSocketServiceConfig {
  cors?: {
    origin: string[];
    methods: string[];
    credentials: boolean;
  };
  pingTimeout?: number;
  pingInterval?: number;
  connectTimeout?: number;
  allowEIO3?: boolean;
  transports?: ('websocket' | 'polling')[];
  allowUpgrades?: boolean;
  maxHttpBufferSize?: number;
}

// 型ガード関数
export function isConnectionInfo(obj: unknown): obj is ConnectionInfo {
  return typeof obj === 'object' && obj !== null && 'socketId' in obj && 'connectedAt' in obj;
}

export function isMessageData(obj: unknown): obj is MessageData {
  return (
    typeof obj === 'object' && obj !== null && 'id' in obj && 'content' in obj && 'senderId' in obj
  );
}

export function isRoomData(obj: unknown): obj is RoomData {
  return typeof obj === 'object' && obj !== null && 'roomId' in obj;
}

export function isErrorData(obj: unknown): obj is ErrorData {
  return typeof obj === 'object' && obj !== null && 'code' in obj && 'message' in obj;
}

export function isValidRoomId(roomId: string): boolean {
  return typeof roomId === 'string' && roomId.length > 0 && roomId.length <= 100;
}

export function isValidUserId(userId: string): boolean {
  return typeof userId === 'string' && userId.length > 0 && userId.length <= 100;
}
