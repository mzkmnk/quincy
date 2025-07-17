# バックエンドアーキテクチャ詳細

## 概要

QuincyのバックエンドはExpress.jsをベースとした TypeScript製のWebサーバーで、Socket.ioを使用してリアルタイムWebSocket通信を提供します。Amazon Q CLIとの統合により、AIアシスタント機能を Web インターフェースで利用できます。

## アーキテクチャ構成

### レイヤー構成

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   HTTP Routes   │  │  WebSocket API  │  │   Middleware    │ │
│  │   /api/health   │  │  Socket.io      │  │   CORS, Helmet  │ │
│  │   /api/websocket│  │  Event Handler  │  │   Logger        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  WebSocket      │  │  Amazon Q CLI   │  │  History        │ │
│  │  Service        │  │  Service        │  │  Service        │ │
│  │  (session mgmt) │  │  (process mgmt) │  │  (SQLite mgmt)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Infrastructure Layer                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Process        │  │  SQLite         │  │  File System    │ │
│  │  Management     │  │  Database       │  │  Operations     │ │
│  │  (child_process)│  │  (session data) │  │  (project dirs) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## コンポーネント詳細

### 1. Express.js Server (apps/backend/src/index.ts)

**責務**:
- HTTPサーバーの初期化と設定
- middleware の設定
- ルーティング設定
- WebSocketサーバーの初期化

**主要設定**:
- Port: 3000（デフォルト）
- CORS設定: 開発環境では localhost:4200 許可
- セキュリティ: Helmet による CSP 設定
- 圧縮: compression middleware
- リクエストログ: カスタムログミドルウェア

### 2. Routes Layer (apps/backend/src/routes/)

#### 2.1 Health Check (health.ts)
- **エンドポイント**: `GET /api/health`
- **機能**: サーバーの稼働状態確認
- **レスポンス**: `{ status: 'OK', timestamp: ISO8601, uptime: number }`

#### 2.2 WebSocket Status (websocket.ts)
- **エンドポイント**: `GET /api/websocket/status`
- **機能**: WebSocket サーバーの状態とイベント一覧
- **レスポンス**: 利用可能イベント、設定情報

### 3. WebSocket Service (apps/backend/src/services/websocket.ts)

**責務**:
- Socket.io サーバーの管理
- クライアント接続の管理
- イベントハンドリング
- セッション管理

**主要機能**:
- **接続管理**: ユーザー接続・切断処理
- **ルーム管理**: プロジェクト別ルーム機能
- **メッセージ中継**: クライアント間通信
- **Amazon Q CLI統合**: プロセス管理サービスとの連携

**WebSocketイベント**:

#### Client → Server
- `q:command`: Amazon Q CLI コマンド実行
- `q:message`: Amazon Q CLI セッションへのメッセージ送信
- `q:abort`: セッション中止
- `q:history`: プロジェクト履歴取得
- `q:projects`: プロジェクト一覧取得
- `q:resume`: セッション再開

#### Server → Client
- `q:response`: Amazon Q CLI からの応答
- `q:error`: エラー通知
- `q:complete`: セッション完了
- `q:session:started`: セッション開始通知
- `session:created`: セッション作成通知

### 4. Amazon Q CLI Service (apps/backend/src/services/amazon-q-cli.ts)

**責務**:
- Amazon Q CLI プロセスの管理
- 子プロセスの起動・監視・終了
- stdout/stderr のパース・中継
- セッション状態管理

**主要機能**:
- **プロセス管理**: 子プロセスの spawn・監視
- **セッション管理**: セッションIDベースの管理
- **データストリーミング**: リアルタイム出力中継
- **エラーハンドリング**: プロセス異常の検出・通知

**セッション状態**:
- `starting`: プロセス開始中
- `running`: 実行中
- `completed`: 正常終了
- `error`: エラー終了
- `aborted`: ユーザー中止
- `terminated`: 強制終了

### 5. History Service (apps/backend/src/services/amazon-q-history.ts)

**責務**:
- Amazon Q CLI履歴データの管理
- SQLite データベースへのアクセス
- 会話履歴の読み取り・提供

**主要機能**:
- **データベース接続**: SQLite3 データベースアクセス
- **履歴取得**: プロジェクト別会話履歴
- **メタデータ管理**: 会話情報の統計データ

### 6. Utilities (apps/backend/src/utils/)

#### 6.1 Logger (logger.ts)
- **機能**: 構造化ログ出力
- **レベル**: INFO, ERROR, WARN
- **フォーマット**: ISO8601 タイムスタンプ付き
- **middleware**: リクエストログ（実行時間含む）

#### 6.2 Error Handler (errors.ts)
- **機能**: 統一的エラーハンドリング
- **レスポンス形式**: `{ error: string, message: string, timestamp: ISO8601, path?: string }`
- **404ハンドリング**: 存在しないエンドポイントの処理

## データフロー

### 1. WebSocket接続フロー

```
Client Connection → Socket.io Middleware → Connection Validation → Event Registration → Session Mapping
```

### 2. Amazon Q CLI実行フロー

```
q:command Event → Process Validation → Amazon Q CLI Spawn → Session Registration → stdout/stderr Streaming
```

### 3. セッション管理フロー

```
Session Creation → SQLite Storage → Memory Mapping → Process Association → Cleanup on Termination
```

## セキュリティ設計

### 1. プロセス分離
- 各セッションは独立したプロセス
- プロセスレベルでのリソース制限
- 適切なworking directory設定

### 2. 入力検証
- プロジェクトパスの絶対パス検証
- コマンドインジェクション防止
- ファイルアクセス制限

### 3. 認証・認可
- Amazon Q CLI での認証委譲
- セッション単位での認証状態管理
- プロセスレベルでの権限制御

## パフォーマンス最適化

### 1. メモリ管理
- バッファリング制御（10KB制限）
- 適切なタイムアウト設定
- リソース監視・クリーンアップ

### 2. 並行処理
- 非同期処理の活用
- EventEmitter による疎結合設計
- 適切なプロセス数制限

### 3. ネットワーク最適化
- WebSocket接続の効率的管理
- 適切なping/pong設定
- 圧縮middleware適用

## 監視・運用

### 1. ログ管理
- 構造化ログによる分析容易性
- 適切なログレベル設定
- パフォーマンス指標の記録

### 2. エラー監視
- プロセス異常の検出
- WebSocket接続エラーの監視
- データベースエラーの処理

### 3. メトリクス
- 接続数監視
- セッション数監視
- レスポンス時間測定

## 開発・テスト

### 1. テスト戦略
- Jest による単体テスト
- WebSocket通信のモックテスト
- プロセス管理のテスト

### 2. 開発ツール
- TypeScript strict mode
- ESLint/Prettier設定
- 開発用ホットリロード（tsx watch）

### 3. デバッグ
- 詳細なログ出力
- プロセス状態の可視化
- WebSocket通信の追跡