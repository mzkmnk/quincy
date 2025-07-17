# API仕様書

## 概要

QuincyのAPIは、RESTful HTTP APIとWebSocket APIの2つの通信方式を提供します。HTTP APIは基本的なサーバー状態の確認に使用し、WebSocket APIはリアルタイムなAmazon Q CLI統合に使用します。

## HTTP API

### ベースURL
- **開発環境**: `http://localhost:3000`
- **本番環境**: 環境変数 `FRONTEND_URL` で設定

### 共通レスポンス形式

#### 成功レスポンス
```json
{
  "status": "success",
  "data": { /* レスポンスデータ */ },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

#### エラーレスポンス
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

### エンドポイント

#### 1. Root Information
- **パス**: `GET /`
- **説明**: API基本情報の取得
- **レスポンス**:
```json
{
  "name": "Quincy Backend API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "projects": "/api/projects",
    "websocket": "/api/websocket"
  }
}
```

#### 2. Health Check
- **パス**: `GET /api/health`
- **説明**: サーバーの稼働状態確認
- **レスポンス**:
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

#### 3. WebSocket Status
- **パス**: `GET /api/websocket/status`
- **説明**: WebSocketサーバーの状態とイベント情報
- **レスポンス**:
```json
{
  "status": "running",
  "message": "WebSocket server is operational",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "endpoints": {
    "connection": "ws://localhost:3000/socket.io/",
    "events": {
      "client_to_server": [
        "q:command",
        "q:abort",
        "q:history",
        "q:projects",
        "q:resume",
        "message:send",
        "room:join",
        "room:leave",
        "ping"
      ],
      "server_to_client": [
        "q:response",
        "q:error",
        "q:complete",
        "q:history:data",
        "q:history:list",
        "session:created",
        "message:received",
        "message:broadcast",
        "room:joined",
        "room:left",
        "error",
        "pong"
      ]
    }
  }
}
```

#### 4. WebSocket Configuration
- **パス**: `GET /api/websocket/info`
- **説明**: WebSocket接続設定情報
- **レスポンス**:
```json
{
  "cors": {
    "origin": ["http://localhost:4200"],
    "methods": ["GET", "POST"],
    "credentials": true
  },
  "configuration": {
    "pingTimeout": 60000,
    "pingInterval": 25000,
    "transports": ["websocket", "polling"]
  },
  "features": [
    "Amazon Q CLI Integration",
    "History Management",
    "Message Broadcasting",
    "Room Management",
    "Error Handling",
    "Heartbeat/Ping-Pong",
    "Reconnection Support"
  ]
}
```

## WebSocket API

### 接続エンドポイント
- **URL**: `ws://localhost:3000/socket.io/`
- **プロトコル**: Socket.io v4.x
- **認証**: 認証なし（Amazon Q CLIが認証を管理）

### 接続設定
```javascript
const socket = io('http://localhost:3000', {
  cors: {
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});
```

### Client → Server イベント

#### 1. Amazon Q CLI管理

##### q:command
Amazon Q CLIセッションを開始します。

```typescript
interface QCommandEvent {
  command: string;          // 実行コマンド（通常は 'chat'）
  workingDir: string;       // 作業ディレクトリの絶対パス
  model?: string;           // 使用するAIモデル
  resume?: boolean;         // セッション再開フラグ
}

// 使用例
socket.emit('q:command', {
  command: 'chat',
  workingDir: '/path/to/project',
  model: 'claude-3-sonnet',
  resume: false
});
```

##### q:message
Amazon Q CLIセッションにメッセージを送信します。

```typescript
interface QMessageEvent {
  sessionId: string;        // セッションID
  message: string;          // 送信するメッセージ
}

// 使用例
socket.emit('q:message', {
  sessionId: 'session_123',
  message: 'Hello Amazon Q'
});
```

##### q:abort
Amazon Q CLIセッションを中止します。

```typescript
interface QAbortEvent {
  sessionId: string;        // 中止するセッションID
}

// 使用例
socket.emit('q:abort', {
  sessionId: 'session_123'
});
```

##### q:project:start
プロジェクト用の新規セッションを開始します。

```typescript
interface QProjectStartEvent {
  projectPath: string;      // プロジェクトパス
  resume?: boolean;         // セッション再開フラグ
}

// 使用例
socket.emit('q:project:start', {
  projectPath: '/path/to/project',
  resume: false
});
```

#### 2. 履歴管理

##### q:history
特定プロジェクトの会話履歴を取得します。

```typescript
// 使用例
socket.emit('q:history', {
  projectPath: '/path/to/project'
});
```

##### q:projects
全プロジェクトの履歴一覧を取得します。

```typescript
// 使用例
socket.emit('q:projects');
```

##### q:resume
既存セッションを再開します。

```typescript
// 使用例
socket.emit('q:resume', {
  projectPath: '/path/to/project',
  conversationId: 'conv_123'  // オプション
});
```

#### 3. メッセージ・ルーム管理

##### message:send
メッセージを送信します。

```typescript
interface MessageSendEvent {
  content: string;          // メッセージ内容
  senderId: string;         // 送信者ID
  type: 'text' | 'system' | 'notification';
  roomId?: string;          // ルームID（オプション）
}

// 使用例
socket.emit('message:send', {
  content: 'Hello',
  senderId: 'user_123',
  type: 'text',
  roomId: 'room_456'
});
```

##### room:join / room:leave
ルームに参加・退出します。

```typescript
interface RoomData {
  roomId: string;           // ルームID
  projectId?: string;       // プロジェクトID（オプション）
  sessionId?: string;       // セッションID（オプション）
}

// 使用例
socket.emit('room:join', {
  roomId: 'project_room_123',
  projectId: 'project_123'
});
```

##### ping
サーバーの生存確認を行います。

```typescript
socket.emit('ping');
```

### Server → Client イベント

#### 1. Amazon Q CLI応答

##### q:response
Amazon Q CLIからの応答データです。

```typescript
interface QResponseEvent {
  sessionId: string;        // セッションID
  data: string;             // 応答データ
  type: 'stream' | 'complete'; // データタイプ
}

// 受信例
socket.on('q:response', (data: QResponseEvent) => {
  console.log('Amazon Q response:', data);
});
```

##### q:error
Amazon Q CLIからのエラー通知です。

```typescript
interface QErrorEvent {
  sessionId: string;        // セッションID
  error: string;            // エラーメッセージ
  code?: string;            // エラーコード
}

// 受信例
socket.on('q:error', (data: QErrorEvent) => {
  console.error('Amazon Q error:', data);
});
```

##### q:complete
Amazon Q CLIセッションの完了通知です。

```typescript
interface QCompleteEvent {
  sessionId: string;        // セッションID
  exitCode: number;         // 終了コード
}

// 受信例
socket.on('q:complete', (data: QCompleteEvent) => {
  console.log('Amazon Q session completed:', data);
});
```

##### q:info
Amazon Q CLIからの情報メッセージです。

```typescript
interface QInfoEvent {
  sessionId: string;        // セッションID
  message: string;          // 情報メッセージ
  type?: 'initialization' | 'status' | 'progress' | 'general';
}

// 受信例
socket.on('q:info', (data: QInfoEvent) => {
  console.info('Amazon Q info:', data);
});
```

#### 2. セッション管理

##### session:created
新しいセッションが作成されました。

```typescript
interface SessionCreatedEvent {
  sessionId: string;        // セッションID
  projectId: string;        // プロジェクトID
}

// 受信例
socket.on('session:created', (data: SessionCreatedEvent) => {
  console.log('Session created:', data);
});
```

##### q:session:started
Amazon Q CLIセッションが開始されました。

```typescript
interface QSessionStartedEvent {
  sessionId: string;        // セッションID
  projectPath: string;      // プロジェクトパス
  model?: string;           // 使用モデル
}

// 受信例
socket.on('q:session:started', (data: QSessionStartedEvent) => {
  console.log('Q session started:', data);
});
```

##### q:session:failed
セッション開始に失敗しました。

```typescript
// 受信例
socket.on('q:session:failed', (data: { error: string }) => {
  console.error('Session failed:', data);
});
```

#### 3. 履歴データ

##### q:history:data
プロジェクトの会話履歴データです。

```typescript
interface QHistoryDataResponse {
  projectPath: string;      // プロジェクトパス
  conversation: AmazonQConversation | null; // 会話データ
  message?: string;         // 補足メッセージ
}

interface AmazonQConversation {
  conversation_id: string;  // 会話ID
  model: string;            // 使用モデル
  transcript: string[];     // 会話履歴
  tools: string[];          // 使用ツール
  context_manager: Record<string, unknown>;
  latest_summary: string | null;
}

// 受信例
socket.on('q:history:data', (data: QHistoryDataResponse) => {
  console.log('History data:', data);
});
```

##### q:history:list
全プロジェクトの履歴一覧です。

```typescript
interface QHistoryListResponse {
  projects: ConversationMetadata[]; // プロジェクト一覧
  count: number;                    // プロジェクト数
}

interface ConversationMetadata {
  projectPath: string;      // プロジェクトパス
  conversation_id: string;  // 会話ID
  messageCount: number;     // メッセージ数
  lastUpdated: Date;        // 最終更新日
  model: string;            // 使用モデル
}

// 受信例
socket.on('q:history:list', (data: QHistoryListResponse) => {
  console.log('Projects list:', data);
});
```

#### 4. メッセージ・ルーム

##### message:received / message:broadcast
メッセージの受信・配信です。

```typescript
interface MessageData {
  id: string;               // メッセージID
  content: string;          // メッセージ内容
  senderId: string;         // 送信者ID
  timestamp: number;        // タイムスタンプ
  type: 'text' | 'system' | 'notification';
}

// 受信例
socket.on('message:received', (data: MessageData) => {
  console.log('Message received:', data);
});

socket.on('message:broadcast', (data: MessageData) => {
  console.log('Message broadcast:', data);
});
```

##### room:joined / room:left
ルーム参加・退出の通知です。

```typescript
interface RoomJoinedEvent {
  roomId: string;           // ルームID
  timestamp: number;        // タイムスタンプ
}

interface RoomLeftEvent {
  roomId: string;           // ルームID
  timestamp: number;        // タイムスタンプ
}

// 受信例
socket.on('room:joined', (data: RoomJoinedEvent) => {
  console.log('Room joined:', data);
});

socket.on('room:left', (data: RoomLeftEvent) => {
  console.log('Room left:', data);
});
```

#### 5. エラー・制御

##### error
一般的なエラー通知です。

```typescript
interface ErrorData {
  code: string;             // エラーコード
  message: string;          // エラーメッセージ
  details?: Record<string, string | number | boolean | null>;
}

// 受信例
socket.on('error', (data: ErrorData) => {
  console.error('Socket error:', data);
});
```

##### pong
ping に対する応答です。

```typescript
// 受信例
socket.on('pong', () => {
  console.log('Pong received');
});
```

## エラーハンドリング

### HTTPエラーコード
- `400`: Bad Request - 不正なリクエスト
- `404`: Not Found - リソースが見つからない
- `500`: Internal Server Error - サーバー内部エラー

### WebSocketエラーコード
- `SOCKET_ERROR`: WebSocket接続エラー
- `Q_COMMAND_ERROR`: Amazon Q CLI コマンドエラー
- `Q_ABORT_ERROR`: セッション中止エラー
- `Q_MESSAGE_ERROR`: メッセージ送信エラー
- `Q_HISTORY_ERROR`: 履歴取得エラー
- `Q_PROJECTS_ERROR`: プロジェクト一覧取得エラー
- `Q_RESUME_ERROR`: セッション再開エラー
- `Q_CLI_NOT_AVAILABLE`: Amazon Q CLI が利用できない
- `Q_HISTORY_UNAVAILABLE`: 履歴データベースが利用できない

## 制限事項

### リクエスト制限
- Body サイズ: 10MB
- Buffer サイズ: 10KB
- 同時接続数: 制限なし（メモリ使用量に依存）

### タイムアウト
- WebSocket Ping Timeout: 60秒
- WebSocket Ping Interval: 25秒
- Connection Timeout: 45秒

### その他の制限
- 絶対パスのみ許可（プロジェクトパス）
- SQLite データベース同時アクセス制限
- プロセス数の制限なし（システムリソースに依存）