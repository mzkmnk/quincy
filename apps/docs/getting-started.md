# Getting Started（開発者向け）

Quincyは、Amazon Q CLIプロセスの管理とプロジェクト管理のためのモダンなツールです。フロントエンドにAngular 20、バックエンドにHono frameworkを使用しています。

> **ユーザー向けの使用方法については[ユーザーガイド](/user-guide/)をご覧ください。**
> このページは開発環境のセットアップと開発者向けの情報を含みます。

## 前提条件

- Node.js 20+ 
- pnpm 8+
- Git

## インストール

1. リポジトリをクローンします：

```bash
git clone https://github.com/mzkmnk/quincy.git
cd quincy
```

2. 依存関係をインストールします：

```bash
pnpm install
```

## 開発環境の起動

### バックエンドの起動

```bash
pnpm dev:backend
```

バックエンドサーバーは `http://localhost:3000` で起動します。

### フロントエンドの起動

```bash
pnpm dev:frontend
```

フロントエンドアプリケーションは `http://localhost:4200` で起動します。

### 全体の起動

両方を同時に起動するには：

```bash
pnpm dev:backend & pnpm dev:frontend
```

## プロジェクト構成

```
quincy/
├── apps/
│   ├── backend/          # Honoフレームワークを使用したAPI
│   ├── frontend/         # Angular 20アプリケーション
│   └── docs/            # VitePressドキュメント
├── packages/            # 共有パッケージ
└── pnpm-workspace.yaml  # ワークスペース設定
```

## 主な機能

### Amazon Q CLI管理
- CLIプロセスの起動・停止・監視
- プロセス状態のリアルタイム表示
- エラーハンドリングと復旧機能

### プロジェクト管理
- 複数プロジェクトの一元管理
- プロジェクト間の切り替え
- 設定ファイルの管理

### チャット機能
- リアルタイムメッセージング
- WebSocket通信
- 入力状態の表示

## API エンドポイント

詳細なAPI仕様については、[API Reference](/api/backend)を参照してください。

## トラブルシューティング

### ポートが使用中の場合

デフォルトポートが使用中の場合は、環境変数で変更できます：

```bash
PORT=3001 pnpm dev:backend
```

### 依存関係のトラブル

依存関係に問題がある場合は、クリーンインストールを試してください：

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 次のステップ

### ユーザー向け
- [ユーザーガイド](/user-guide/) - GUIアプリケーションの使用方法

### 開発者向け
- [API Reference](/api/backend) - バックエンドAPIの詳細
- [Frontend Components](/api/frontend) - フロントエンドコンポーネントの使用方法