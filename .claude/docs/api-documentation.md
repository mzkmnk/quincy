# API ドキュメント

## 概要

このAPIドキュメントは、バックエンドアーキテクチャリファクタリング後のサービスAPIについて説明します。

## 基本情報

- **ベースURL**: `http://localhost:3000`
- **WebSocketエンドポイント**: `ws://localhost:3000/socket.io/`
- **プロトコル**: HTTP/1.1、WebSocket
- **認証**: なし（開発環境）

## RESTful API

### Health Check API

#### GET /health

システムの健康状態を確認します。

**リクエスト**

```
GET /health
```

**レスポンス**

```json
{
  "status": "healthy",
  "timestamp": "2025-07-18T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": 50331648,
    "total": 134217728
  },
  "services": {
    "database": "available",
    "amazonQCli": "available"
  }
}
```

### WebSocket API

#### GET /websocket/status

WebSocketサーバーの状態を確認します。

**リクエスト**

```
GET /websocket/status
```

**レスポンス**

```json
{
  "status": "running",
  "message": "WebSocket server is operational",
  "timestamp": "2025-07-18T10:30:00.000Z",
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

#### GET /websocket/info

WebSocketサーバーの設定情報を取得します。

**リクエスト**

```
GET /websocket/info
```

**レスポンス**

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

### 接続

**エンドポイント**: `ws://localhost:3000/socket.io/`

**接続例**

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
});
```

### Amazon Q CLI 関連イベント

#### 1. q:command

Amazon Q CLIコマンドを実行します。

**送信**

```typescript
socket.emit('q:command', {
  command: string;
  sessionId?: string;
  workingDir: string;
  model?: string;
  resume?: boolean;
});
```

**受信**

```typescript
// セッション作成通知
socket.on('session:created', (data: { sessionId: string; timestamp: string }) => {});

// セッション開始通知
socket.on('q:session:started', (data: { sessionId: string; pid: number; timestamp: string }) => {});

// レスポンス受信
socket.on(
  'q:response',
  (data: {
    sessionId: string;
    type: 'stdout' | 'stderr' | 'info' | 'error';
    content: string;
    timestamp: string;
  }) => {}
);

// セッション完了
socket.on('q:complete', (data: { sessionId: string; timestamp: string }) => {});
```

**エラー**

```typescript
socket.on(
  'q:error',
  (error: { code: 'Q_COMMAND_ERROR'; message: string; details?: Record<string, any> }) => {}
);
```

#### 2. q:message

Amazon Q セッションにメッセージを送信します。

**送信**

```typescript
socket.emit('q:message', {
  sessionId: string;
  message: string;
}, (response: {
  success: boolean;
  error?: string;
}) => {});
```

**エラー**

```typescript
socket.on(
  'q:error',
  (error: { code: 'Q_MESSAGE_ERROR'; message: string; details?: Record<string, any> }) => {}
);
```

#### 3. q:abort

Amazon Q セッションを中止します。

**送信**

```typescript
socket.emit('q:abort', {
  sessionId: string;
});
```

**エラー**

```typescript
socket.on(
  'q:error',
  (error: { code: 'Q_ABORT_ERROR'; message: string; details?: Record<string, any> }) => {}
);
```

#### 4. q:history

プロジェクトの履歴を取得します。

**送信**

```typescript
socket.emit('q:history', {
  projectPath: string;
});
```

**受信**

```typescript
socket.on(
  'q:history:data',
  (data: { projectPath: string; conversation: AmazonQConversation | null; message?: string }) => {}
);
```

**エラー**

```typescript
socket.on(
  'q:error',
  (error: {
    code: 'Q_HISTORY_ERROR' | 'Q_HISTORY_UNAVAILABLE';
    message: string;
    details?: Record<string, any>;
  }) => {}
);
```

#### 5. q:history:detailed

詳細な履歴を取得します。

**送信**

```typescript
socket.emit('q:history:detailed', {
  projectPath: string;
});
```

**受信**

```typescript
socket.on(
  'q:history:detailed:data',
  (data: {
    projectPath: string;
    displayMessages: DisplayMessage[];
    stats: ConversationStats | null;
    message?: string;
  }) => {}
);
```

**エラー**

```typescript
socket.on(
  'q:error',
  (error: {
    code: 'Q_HISTORY_DETAILED_ERROR' | 'Q_HISTORY_UNAVAILABLE';
    message: string;
    details?: Record<string, any>;
  }) => {}
);
```

#### 6. q:projects

全プロジェクトの履歴一覧を取得します。

**送信**

```typescript
socket.emit('q:projects');
```

**受信**

```typescript
socket.on('q:history:list', (data: { projects: ConversationMetadata[]; count: number }) => {});
```

**エラー**

```typescript
socket.on(
  'q:error',
  (error: {
    code: 'Q_PROJECTS_ERROR' | 'Q_PROJECTS_UNAVAILABLE';
    message: string;
    details?: Record<string, any>;
  }) => {}
);
```

#### 7. q:resume

セッションを再開します。

**送信**

```typescript
socket.emit('q:resume', {
  projectPath: string;
  conversationId?: string;
});
```

**受信**

```typescript
// 成功時
socket.on('q:session:started', (data: { sessionId: string; pid: number; timestamp: string }) => {});

// 失敗時
socket.on('q:session:failed', (data: { projectPath: string; error: string }) => {});
```

**エラー**

```typescript
socket.on(
  'q:error',
  (error: {
    code: 'Q_RESUME_ERROR' | 'Q_RESUME_UNAVAILABLE' | 'Q_RESUME_NO_HISTORY';
    message: string;
    details?: Record<string, any>;
  }) => {}
);
```

#### 8. q:project:start

プロジェクトセッションを開始します。

**送信**

```typescript
socket.emit('q:project:start', {
  projectPath: string;
  resume?: boolean;
});
```

**受信**

```typescript
socket.on('q:session:started', (data: { sessionId: string; pid: number; timestamp: string }) => {});

socket.on('session:created', (data: { sessionId: string; timestamp: string }) => {});
```

**エラー**

```typescript
socket.on(
  'q:error',
  (error: {
    code:
      | 'Q_PROJECT_START_ERROR'
      | 'Q_CLI_NOT_AVAILABLE'
      | 'Q_CLI_NOT_FOUND'
      | 'Q_CLI_PERMISSION_ERROR'
      | 'Q_CLI_SPAWN_ERROR';
    message: string;
    details?: Record<string, any>;
  }) => {}
);
```

### 基本的なWebSocketイベント

#### 1. message:send

メッセージを送信します。

**送信**

```typescript
socket.emit('message:send', {
  content: string;
  room?: string;
});
```

**受信**

```typescript
socket.on(
  'message:received',
  (data: { id: string; content: string; timestamp: string; userId: string }) => {}
);

socket.on(
  'message:broadcast',
  (data: { id: string; content: string; timestamp: string; userId: string; room?: string }) => {}
);
```

#### 2. room:join

ルームに参加します。

**送信**

```typescript
socket.emit('room:join', {
  roomId: string;
});
```

**受信**

```typescript
socket.on('room:joined', (data: { roomId: string; userId: string; timestamp: string }) => {});
```

#### 3. room:leave

ルームから離脱します。

**送信**

```typescript
socket.emit('room:leave', {
  roomId: string;
});
```

**受信**

```typescript
socket.on('room:left', (data: { roomId: string; userId: string; timestamp: string }) => {});
```

#### 4. ping/pong

ハートビート機能

**送信**

```typescript
socket.emit('ping');
```

**受信**

```typescript
socket.on('pong', (data: { timestamp: string }) => {});
```

### 型定義

#### AmazonQConversation

```typescript
interface AmazonQConversation {
  id: string;
  projectPath: string;
  startTime: number;
  endTime?: number;
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  thinkingSteps: number;
  toolsUsed: string[];
  model?: string;
  environment?: Record<string, string>;
}
```

#### DisplayMessage

```typescript
interface DisplayMessage {
  id: string;
  type: 'user' | 'ai' | 'thinking' | 'environment' | 'tools' | 'stats';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}
```

#### ConversationStats

```typescript
interface ConversationStats {
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  thinkingSteps: number;
  toolsUsed: string[];
  startTime: number;
  endTime?: number;
  duration?: number;
}
```

#### ConversationMetadata

```typescript
interface ConversationMetadata {
  id: string;
  projectPath: string;
  lastModified: number;
  messageCount: number;
  model?: string;
  preview?: string;
}
```

### エラーハンドリング

#### 共通エラー形式

```typescript
interface ErrorData {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean | null>;
}
```

#### エラーコード一覧

- `Q_COMMAND_ERROR` - コマンド実行エラー
- `Q_MESSAGE_ERROR` - メッセージ送信エラー
- `Q_ABORT_ERROR` - セッション中止エラー
- `Q_HISTORY_ERROR` - 履歴取得エラー
- `Q_HISTORY_UNAVAILABLE` - 履歴データベース利用不可
- `Q_HISTORY_DETAILED_ERROR` - 詳細履歴取得エラー
- `Q_PROJECTS_ERROR` - プロジェクト一覧取得エラー
- `Q_PROJECTS_UNAVAILABLE` - プロジェクトデータベース利用不可
- `Q_RESUME_ERROR` - セッション再開エラー
- `Q_RESUME_UNAVAILABLE` - 再開機能利用不可
- `Q_RESUME_NO_HISTORY` - 再開可能な履歴なし
- `Q_PROJECT_START_ERROR` - プロジェクト開始エラー
- `Q_CLI_NOT_AVAILABLE` - Amazon Q CLI利用不可
- `Q_CLI_NOT_FOUND` - Amazon Q CLI未発見
- `Q_CLI_PERMISSION_ERROR` - Amazon Q CLI権限エラー
- `Q_CLI_SPAWN_ERROR` - Amazon Q CLIプロセス起動エラー

### 使用例

#### 基本的な使用法

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// 接続
socket.on('connect', () => {
  console.log('Connected');
});

// Amazon Q コマンド実行
socket.emit('q:command', {
  command: 'help',
  workingDir: '/path/to/project',
});

// レスポンス受信
socket.on('q:response', data => {
  console.log('Response:', data.content);
});

// エラーハンドリング
socket.on('q:error', error => {
  console.error('Error:', error.message);
});
```

#### 履歴取得の例

```typescript
// プロジェクト履歴取得
socket.emit('q:history', {
  projectPath: '/path/to/project',
});

socket.on('q:history:data', data => {
  if (data.conversation) {
    console.log('Conversation found:', data.conversation);
  } else {
    console.log('No conversation history');
  }
});

// 詳細履歴取得
socket.emit('q:history:detailed', {
  projectPath: '/path/to/project',
});

socket.on('q:history:detailed:data', data => {
  console.log('Display messages:', data.displayMessages);
  console.log('Stats:', data.stats);
});
```

#### セッション管理の例

```typescript
let currentSessionId: string | null = null;

// セッション作成
socket.on('session:created', data => {
  currentSessionId = data.sessionId;
  console.log('Session created:', data.sessionId);
});

// メッセージ送信
if (currentSessionId) {
  socket.emit(
    'q:message',
    {
      sessionId: currentSessionId,
      message: 'Hello, Amazon Q!',
    },
    response => {
      if (response.success) {
        console.log('Message sent successfully');
      } else {
        console.error('Failed to send message:', response.error);
      }
    }
  );
}

// セッション中止
if (currentSessionId) {
  socket.emit('q:abort', {
    sessionId: currentSessionId,
  });
}
```

### 注意事項

1. **セッション管理**: セッションIDは必ず保持し、適切に管理してください
2. **エラーハンドリング**: 全てのイベントに対してエラーハンドリングを実装してください
3. **接続状態**: 接続状態を監視し、必要に応じて再接続を実装してください
4. **リソース管理**: 不要になったセッションは適切に中止してください
5. **認証**: 本番環境では適切な認証機能を実装してください
