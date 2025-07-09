/**
 * WebSocketイベント関連の型定義
 */

// クライアント → サーバーのイベント
export interface ClientToServerEvents {
  'q:command': (data: QCommandEvent) => void;
  'q:abort': (data: QAbortEvent) => void;
  'shell:init': (data: ShellInitEvent) => void;
  'shell:input': (data: ShellInputEvent) => void;
  'shell:resize': (data: ShellResizeEvent) => void;
}

// サーバー → クライアントのイベント
export interface ServerToClientEvents {
  'q:response': (data: QResponseEvent) => void;
  'q:error': (data: QErrorEvent) => void;
  'q:complete': (data: QCompleteEvent) => void;
  'project:update': (data: ProjectUpdateEvent) => void;
  'shell:output': (data: ShellOutputEvent) => void;
  'shell:exit': (data: ShellExitEvent) => void;
  'session:created': (data: SessionCreatedEvent) => void;
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

export interface ProjectUpdateEvent {
  type: 'created' | 'updated' | 'deleted';
  project: any; // Projectインターフェースをインポート
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