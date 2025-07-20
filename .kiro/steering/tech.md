# 技術スタック・ビルドシステム

## パッケージマネージャー

- **pnpm** が必須のパッケージマネージャー（package.jsonで強制）
- モノレポ管理にpnpm workspacesを使用

## フロントエンドスタック

- **Angular 20** （zoneless change detection使用）
- **TypeScript 5.8+** （型安全性のため）
- **PrimeNG 20** + Auraテーマ（UIコンポーネント）
- **Tailwind CSS 4** + PrimeUI統合（スタイリング）
- **@ngrx/signals** （状態管理）
- **Socket.io Client** （WebSocket通信）
- **RxJS** （リアクティブプログラミング）

## バックエンドスタック

- **Node.js 20+** + ESモジュール
- **Express.js 5** （HTTPサーバー）
- **Socket.io** （WebSocketサーバー）
- **TypeScript** （strict設定）
- **better-sqlite3** （データベース）
- **tsx** （開発時ホットリロード）
- **esbuild** （本番ビルド）

## 共有依存関係

- **@quincy/shared** ワークスペースパッケージ（共有型定義）
- アプリ間で共通のTypeScript設定

## 開発コマンド

### ルートレベル

```bash
# バックエンド開発サーバー起動
pnpm dev:backend

# フロントエンド開発サーバー起動
pnpm dev:frontend

# ドキュメントサーバー起動
pnpm dev:docs

# 全アプリケーションビルド
pnpm build

# 特定アプリのビルド
pnpm build:backend
pnpm build:frontend
```

### バックエンド固有

```bash
# ホットリロード付き開発
pnpm --filter backend dev

# 型チェック
pnpm --filter backend typecheck

# 本番ビルド
pnpm --filter backend build

# テスト実行
pnpm --filter backend test

# 本番サーバー起動
pnpm --filter backend start:prod
```

### フロントエンド固有

```bash
# 開発サーバー
pnpm --filter frontend start

# 本番ビルド
pnpm --filter frontend build

# テスト実行
pnpm --filter frontend test

# ウォッチモードビルド
pnpm --filter frontend watch
```

## ビルド設定

- バックエンドは外部依存関係を含むesbuildによる高速バンドル
- フロントエンドは標準Angular CLIビルドパイプライン
- 全パッケージでTypeScript strictモード有効
- バックエンド全体でESMモジュール使用
