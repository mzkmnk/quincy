# Backend API Reference

QuincyのバックエンドAPIは、Honoフレームワークを使用して構築されており、RESTful APIとWebSocket接続を提供します。

## Base URL

```
http://localhost:3000
```

## エンドポイント

### Health Check

#### GET /health

システムの状態を確認します。

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Projects API

#### GET /api/projects

すべてのプロジェクトのリストを取得します。

**Response:**
```json
{
  "projects": [
    {
      "id": "project-1",
      "name": "Sample Project",
      "path": "/path/to/project",
      "status": "active"
    }
  ]
}
```

#### POST /api/projects

新しいプロジェクトを作成します。

**Request Body:**
```json
{
  "name": "New Project",
  "path": "/path/to/new/project"
}
```

**Response:**
```json
{
  "id": "project-2",
  "name": "New Project",
  "path": "/path/to/new/project",
  "status": "active"
}
```

### Amazon Q CLI API

#### POST /api/amazon-q/start

Amazon Q CLIプロセスを開始します。

**Request Body:**
```json
{
  "projectId": "project-1"
}
```

**Response:**
```json
{
  "processId": "proc-123",
  "status": "starting",
  "projectId": "project-1"
}
```

#### POST /api/amazon-q/stop

Amazon Q CLIプロセスを停止します。

**Request Body:**
```json
{
  "processId": "proc-123"
}
```

**Response:**
```json
{
  "processId": "proc-123",
  "status": "stopped"
}
```

#### GET /api/amazon-q/status

プロセスの状態を取得します。

**Response:**
```json
{
  "processes": [
    {
      "processId": "proc-123",
      "status": "running",
      "projectId": "project-1",
      "startedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## WebSocket API

### 接続

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
```

### イベント

#### Process Status Update

プロセスの状態が変更されたときに送信されます。

```json
{
  "type": "process_status",
  "data": {
    "processId": "proc-123",
    "status": "running",
    "projectId": "project-1"
  }
}
```

#### Chat Message

チャットメッセージが送信されたときに送信されます。

```json
{
  "type": "chat_message",
  "data": {
    "id": "msg-123",
    "content": "Hello, world!",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "sender": "user"
  }
}
```

#### Typing Indicator

ユーザーが入力中であることを示します。

```json
{
  "type": "typing",
  "data": {
    "userId": "user-123",
    "isTyping": true
  }
}
```

## エラーハンドリング

すべてのAPIエンドポイントは、エラーが発生した場合に以下の形式でレスポンスを返します：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### 一般的なエラーコード

- `INVALID_REQUEST` - リクエストが無効
- `NOT_FOUND` - リソースが見つからない
- `PROCESS_ERROR` - プロセス関連のエラー
- `INTERNAL_ERROR` - サーバー内部エラー