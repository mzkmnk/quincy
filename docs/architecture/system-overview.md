# システム全体アーキテクチャ

## 概要

Quincy（Amazon Q Developer CLIのWebベースUI）は、Amazon Q Developer CLIのWebインターフェースを提供するモダンなWebアプリケーションです。リアルタイムチャットインターフェースを通じて、Amazon Q Developer AIアシスタントとの対話を可能にします。

## システム構成

### 高レベルアーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Angular 20     │────▶│  Express.js     │────▶│  Amazon Q CLI   │
│  Frontend       │     │  Backend        │     │  Process        │
│  (Port 4200)    │     │  (Port 3000)    │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  PrimeNG UI     │     │  Socket.io      │     │  AWS IAM        │
│  Components     │     │  WebSocket      │     │  Identity       │
│  Tailwind CSS   │     │  Server         │     │  Center         │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 技術スタック

#### フロントエンド

- **Framework**: Angular 20 (Standalone Components)
- **State Management**: @ngrx/signals
- **UI Components**: PrimeNG 20.0.0-rc.3
- **Styling**: Tailwind CSS 4.1.11
- **WebSocket Client**: Socket.io-client

#### バックエンド

- **Framework**: Express.js 5.1.0
- **Runtime**: Node.js 20 with TypeScript
- **WebSocket Server**: Socket.io 4.7.5
- **Database**: SQLite3 (session persistence)
- **Security**: Helmet, CORS

#### 外部統合

- **Amazon Q CLI**: コマンドラインツール（子プロセス経由）
- **AWS Authentication**: IAM Identity Center

## データフロー

### 1. ユーザー操作からAmazon Q CLIへの流れ

```
ユーザー入力 → Angular Component → WebSocket Client → Socket.io Server → Express Backend → Amazon Q CLI Process
```

### 2. Amazon Q CLIからユーザーへの応答流れ

```
Amazon Q CLI Process → stdout/stderr → Express Backend → Socket.io Server → WebSocket Client → Angular Component → UI Update
```

### 3. セッション管理

```
WebSocket Connection → Session Creation → SQLite Database → Session Mapping → Process Management
```

## セキュリティ境界

### 1. 認証レイヤー

- Amazon Q CLIへの認証委譲
- セッション管理による認証状態の維持

### 2. プロセス分離

- 各ユーザーセッションは独立したプロセス
- ファイルシステムアクセス制限

### 3. 通信セキュリティ

- WebSocket通信の暗号化
- CORS設定による適切なorigin制限

## 主要コンポーネント

### フロントエンド

1. **Chat Component**: ユーザーインターフェース
2. **WebSocket Service**: リアルタイム通信
3. **State Management**: アプリケーション状態管理
4. **Project Management**: プロジェクト選択・管理

### バックエンド

1. **Express Server**: HTTP API サーバー
2. **WebSocket Service**: リアルタイム通信ハンドラー
3. **Amazon Q CLI Service**: プロセス管理サービス
4. **History Service**: セッション履歴管理

### 外部システム

1. **Amazon Q CLI**: AI アシスタントエンジン
2. **AWS IAM Identity Center**: 認証サービス
3. **SQLite Database**: セッション永続化

## 環境設定

### 開発環境

- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:3000
- **WebSocket**: ws://localhost:3000/socket.io/

### 本番環境

- 環境変数による設定
- セキュリティ強化（CSP、HTTPS等）
- プロセス監視・管理

## 運用特性

### スケーラビリティ

- 単一インスタンスでの複数ユーザーセッション対応
- WebSocket接続の効率的な管理
- メモリ使用量の最適化

### 可用性

- プロセス監視機能
- セッション復旧機能
- エラーハンドリング

### 監視・ログ

- 構造化ログ出力
- リアルタイムメトリクス
- プロセス状態監視

## 開発・デプロイメント

### 開発フロー

1. モノレポ管理（pnpm workspaces）
2. 共有型定義パッケージ
3. TypeScript強制チェック
4. Test-Driven Development（TDD）

### CI/CD

- Jest単体テスト
- TypeScript型チェック
- Lint・フォーマット
- ビルド・デプロイ自動化
