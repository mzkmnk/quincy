# Amazon Q Developer UI

Amazon Q Developer CLIのための直感的なWebベースユーザーインターフェースです。このプロジェクトは[claudecodeui](https://github.com/siteboon/claudecodeui)からインスパイアを受け、Angular（フロントエンド）とExpress.js（バックエンド）で構築されています。

## 概要

Amazon Q Developer UIは、Amazon Q Developer CLIの機能をブラウザから利用できるようにするWebアプリケーションです。開発者がAIアシスタントとより効率的に対話し、コード生成、デバッグ、リファクタリングなどのタスクを実行できるよう支援します。

## 主な機能

- 🚀 **リアルタイムチャット**: Amazon Qとの対話型コーディングセッション
- 📁 **ファイル管理**: プロジェクトファイルの閲覧・編集
- 💻 **統合ターミナル**: Webベースのターミナルアクセス
- 🔄 **セッション管理**: 会話の永続化と復元
- 📱 **レスポンシブデザイン**: デスクトップ・モバイル対応

## アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────────────────────┐
│                           ユーザーブラウザ                            │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                     Angular Frontend                          │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │ Chat UI     │  │ File Explorer │  │ Terminal UI     │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │  │
│  │                      WebSocket Client                        │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ WebSocket
                                  │ HTTP/REST
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Express.js Backend                            │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                      API Routes                               │  │
│  │  ┌────────────┐  ┌───────────┐  ┌──────────────────────┐  │  │
│  │  │ Projects   │  │ Sessions  │  │ Files                │  │  │
│  │  │ Management │  │ Management│  │ Management           │  │  │
│  │  └────────────┘  └───────────┘  └──────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   WebSocket Server                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │  │
│  │  │ Q Commands │  │ Terminal   │  │ Real-time Updates   │  │  │
│  │  │ Handler    │  │ Handler    │  │ Handler             │  │  │
│  │  └────────────┘  └────────────┘  └─────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                 Amazon Q CLI Integration                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │ Process      │  │ Session      │  │ Output Parser   │  │  │
│  │  │ Manager      │  │ Persistence  │  │                 │  │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Child Process
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Amazon Q Developer CLI                         │
│             （認証済み、ユーザーのローカル環境で実行）                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AWS IAM Identity Center                         │
│                  （認証はCLIに完全に委譲）                            │
└─────────────────────────────────────────────────────────────────────┘
```

### データフロー

1. **ユーザー入力**
   - ユーザーがAngularフロントエンドでメッセージを入力
   - WebSocket経由でバックエンドに送信

2. **コマンド処理**
   - Express.jsバックエンドがWebSocketメッセージを受信
   - Amazon Q CLIプロセスを起動または既存セッションに接続
   - コマンドをCLIプロセスの標準入力に送信

3. **レスポンス処理**
   - CLIプロセスの標準出力/エラー出力を監視
   - レスポンスをパース（JSON/テキスト形式）
   - WebSocket経由でフロントエンドに送信

4. **UI更新**
   - Angularがレスポンスを受信
   - チャットUIを更新
   - 必要に応じてファイルエクスプローラーやターミナルも更新

## 技術スタック

### フロントエンド

- **Angular 20**: 最新のWebフレームワーク
- **TypeScript**: 型安全な開発
- **RxJS**: リアクティブプログラミング
- **PrimeNG**: UIコンポーネント
- **Tailwind CSS**: CSSフレームワーク
- **@ngrx/signals**: 状態管理
- **Socket.io Client**: WebSocket通信

### バックエンド

- **Express.js**: Node.jsのWebフレームワーク
- **Node.js**: JavaScriptランタイム
- **TypeScript**: 型安全な開発
- **Socket.io**: WebSocketサーバー
- **SQLite3**: データベース
- **Jest**: テストフレームワーク
- **child_process**: プロセス管理

## セキュリティ

### 認証フロー

```
ユーザー ─────► Amazon Q UI ─────► Amazon Q CLI ─────► AWS IAM Identity Center
                    │                    │
                    │                    └─► 既に認証済み（前提条件）
                    │
                    └─► 認証状態を確認するのみ（認証情報は保持しない）
```

### セキュリティ原則

1. **認証の委譲**: すべての認証はAmazon Q CLIに委譲
2. **認証情報の非保持**: UIは認証情報を一切保持しない
3. **プロセス分離**: 各セッションは独立したプロセスで実行
4. **ファイルアクセス制限**: プロジェクトディレクトリ内のみアクセス可能

## 前提条件

- Node.js v16以上
- pnpm
- Amazon Q Developer CLI（インストール済み・認証済み）
- AWS IAM Identity Centerでの認証完了

## インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/quincy.git
cd quincy

# 依存関係のインストール
pnpm install

# 開発サーバーの起動
# バックエンド（ポート3000）
pnpm dev:backend
# または
pnpm --filter backend dev

# フロントエンド（ポート4200）
pnpm dev:frontend
# または
pnpm --filter frontend start
```

## 使用方法

1. Amazon Q CLIが認証済みであることを確認

   ```bash
   q --version  # CLIがインストールされていることを確認
   q chat       # 認証状態を確認（正常に動作すること）
   ```

2. アプリケーションを起動

   ```bash
   # 別々のターミナルで実行
   pnpm dev:backend
   pnpm dev:frontend
   ```

3. ブラウザで `http://localhost:4200` にアクセス

4. プロジェクトを選択してAmazon Qとの対話を開始

## 開発

### プロジェクト構造

```
quincy/
├── apps/
│   ├── backend/         # Express.jsバックエンド
│   │   ├── src/
│   │   │   ├── routes/  # APIルート
│   │   │   ├── services/# ビジネスロジック
│   │   │   └── utils/   # ユーティリティ
│   │   └── package.json
│   └── frontend/        # Angularフロントエンド
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/     # コアサービス
│       │   │   ├── features/ # 機能モジュール
│       │   │   └── shared/   # 共有コンポーネント
│       │   └── environments/
│       └── package.json
├── package.json         # ルートpackage.json
├── pnpm-workspace.yaml  # pnpmワークスペース設定
└── README.md
```

### 開発コマンド

```bash
# バックエンドのビルド
pnpm build:backend
# または
pnpm --filter backend build

# フロントエンドのテスト実行
pnpm --filter frontend test

# バックエンドのテスト実行
pnpm --filter backend test

# 型チェック
pnpm --filter backend typecheck

# リント実行
pnpm --filter backend lint
pnpm --filter frontend lint
```

## トラブルシューティング

### Amazon Q CLIが見つからない

```bash
# CLIのインストール
brew install amazon-q  # macOS
# または公式ドキュメントに従ってインストール

# 認証
q configure
```

### WebSocket接続エラー

- バックエンドが起動していることを確認
- ポート3000が使用されていないことを確認
- CORSの設定を確認

### セッションが保存されない

- プロジェクトディレクトリの書き込み権限を確認
- ディスク容量を確認

問題が発生した場合は、[Issues](https://github.com/yourusername/quincy/issues)で報告してください。
