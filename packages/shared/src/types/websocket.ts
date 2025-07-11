/**
 * WebSocketイベント関連の型定義
 */

import type { Project, ProjectEvent, ProjectScanResult } from './project';

// クライアント → サーバーのイベント
export interface ClientToServerEvents {
  'q:command': (data: QCommandEvent) => void;
  'q:abort': (data: QAbortEvent) => void;
  'shell:init': (data: ShellInitEvent) => void;
  'shell:input': (data: ShellInputEvent) => void;
  'shell:resize': (data: ShellResizeEvent) => void;
  'auth:request': (data: AuthenticationData) => void;
  'message:send': (data: MessageSendEvent) => void;
  'room:join': (data: RoomData) => void;
  'room:leave': (data: RoomData) => void;
  'ping': () => void;
  'projects:scan': () => void;
  'project:refresh': (data: { projectId: string }) => void;
}

// サーバー → クライアントのイベント
export interface ServerToClientEvents {
  'q:response': (data: QResponseEvent) => void;
  'q:error': (data: QErrorEvent) => void;
  'q:complete': (data: QCompleteEvent) => void;
  'project:created': (data: { project: Project }) => void;
  'project:updated': (data: { project: Project }) => void;
  'project:deleted': (data: { projectId: string }) => void;
  'projects:scanned': (data: { result: ProjectScanResult }) => void;
  'shell:output': (data: ShellOutputEvent) => void;
  'shell:exit': (data: ShellExitEvent) => void;
  'session:created': (data: SessionCreatedEvent) => void;
  'auth:success': (data: ConnectionInfo) => void;
  'auth:failure': (data: ErrorData) => void;
  'message:received': (data: MessageData) => void;
  'message:broadcast': (data: MessageData) => void;
  'room:joined': (data: RoomJoinedEvent) => void;
  'room:left': (data: RoomLeftEvent) => void;
  'error': (data: ErrorData) => void;
  'pong': () => void;
}

// イベントペイロードの型定義
export interface QCommandEvent {
  command: string;
  sessionId?: string;
  workingDir: string;
  model?: string;
  resume?: boolean;
}

export interface QAbortEvent {
  sessionId: string;
}

export interface QResponseEvent {
  sessionId: string;
  data: string;
  type: 'stream' | 'complete';
}

export interface QErrorEvent {
  sessionId: string;
  error: string;
  code?: string;
}

export interface QCompleteEvent {
  sessionId: string;
  exitCode: number;
}


export interface ShellInitEvent {
  projectPath: string;
  cols?: number;
  rows?: number;
}

export interface ShellInputEvent {
  sessionId: string;
  data: string;
}

export interface ShellResizeEvent {
  sessionId: string;
  cols: number;
  rows: number;
}

export interface ShellOutputEvent {
  sessionId: string;
  data: string;
}

export interface ShellExitEvent {
  sessionId: string;
  code: number;
}

export interface SessionCreatedEvent {
  sessionId: string;
  projectId: string;
}

// 新しいWebSocket通信用の型定義
export interface AuthenticationData {
  token?: string;
  sessionId?: string;
  userId?: string;
}

export interface MessageData {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
  type: 'text' | 'system' | 'notification';
}

export interface MessageSendEvent {
  content: string;
  senderId: string;
  type: 'text' | 'system' | 'notification';
  roomId?: string;
}

export interface RoomData {
  roomId: string;
  projectId?: string;
  sessionId?: string;
}

export interface RoomJoinedEvent {
  roomId: string;
  userId: string;
  timestamp: number;
}

export interface RoomLeftEvent {
  roomId: string;
  userId: string;
  timestamp: number;
}

export interface ErrorData {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ConnectionInfo {
  socketId: string;
  userId?: string;
  sessionId?: string;
  connectedAt: number;
  authenticated: boolean;
}

// Socket.ioのSocket型用のデータ
export interface SocketData {
  userId?: string;
  sessionId?: string;
  authenticated: boolean;
  rooms: string[];
}

// サーバー間通信用のイベント
export interface InterServerEvents {
  'message:broadcast': (data: MessageData) => void;
}