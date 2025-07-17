# Quincy アーキテクチャドキュメント

## 概要

このディレクトリには、Quincy（Amazon Q Developer CLIのWebベースUI）のアーキテクチャドキュメントと図が含まれています。

Quincyは、Amazon Q Developer CLIの機能をWebインターフェースで提供するモダンなWebアプリケーションです。リアルタイムチャットインターフェースを通じて、Amazon Q Developer AIアシスタントとの対話を可能にします。

## ドキュメント構成

### アーキテクチャドキュメント

#### 1. [システム全体概要](./system-overview.md)
- システムの全体的な構成と設計思想
- 技術スタック（Angular 20, Express.js, Socket.io）
- データフローとセキュリティ境界
- 開発・運用特性

#### 2. [バックエンドアーキテクチャ詳細](./backend-architecture.md)
- Express.jsベースのバックエンドの詳細設計
- WebSocket Service、Amazon Q CLI Service、History Service
- プロセス管理とセッション管理
- パフォーマンス最適化と監視

#### 3. [API仕様書](./api-specification.md)
- HTTP APIエンドポイント詳細
- WebSocket APIイベント仕様
- リクエスト/レスポンス形式
- エラーハンドリング

#### 4. [セキュリティアーキテクチャ](./security-architecture.md)
- 認証・認可の仕組み（Amazon Q CLIへの委譲）
- プロセス分離とサンドボックス
- 入力検証とセキュリティ対策
- 監査とモニタリング

### アーキテクチャ図

#### 1. [システムコンテキスト図](../diagrams/system-context.md)
- C4モデルのシステムコンテキスト
- 外部システムとの関係
- 技術スタック概要

#### 2. [コンテナ図](../diagrams/container-diagram.md)
- C4モデルのコンテナ図
- フロントエンド・バックエンドの通信
- データフロー

#### 3. [コンポーネント図](../diagrams/component-diagram.md)
- バックエンドの内部構造
- サービス間の依存関係
- イベント駆動アーキテクチャ

#### 4. [シーケンス図](../diagrams/sequence-diagram.md)
- ユーザー操作フロー
- メッセージ送信・受信フロー
- セッション管理フロー

#### 5. [デプロイメント図](../diagrams/deployment-diagram.md)
- 開発環境と本番環境の構成
- Docker化とCI/CDパイプライン
- 環境設定管理

## 技術スタック

### フロントエンド
- **Framework**: Angular 20 (Standalone Components)
- **UI Components**: PrimeNG 20.0.0-rc.3
- **Styling**: Tailwind CSS 4.1.11
- **State Management**: @ngrx/signals
- **WebSocket**: Socket.io-client 4.7.5

### バックエンド
- **Framework**: Express.js 5.1.0
- **Runtime**: Node.js 20 with TypeScript
- **WebSocket**: Socket.io 4.7.5
- **Database**: SQLite3 12.2.0
- **Security**: Helmet, CORS
- **Process Management**: child_process API

### 共通
- **Language**: TypeScript 5.8.3
- **Package Manager**: pnpm (workspaces)
- **Testing**: Jest, Karma/Jasmine
- **Build Tools**: esbuild, Angular CLI

### 外部統合
- **Amazon Q CLI**: コマンドラインツール
- **AWS Services**: IAM Identity Center, Amazon Q Developer

## 主要な設計決定

### 1. Express.js vs Hono
- **決定**: Express.js 5.1.0を採用
- **理由**: 豊富なエコシステム、Socket.ioとの統合、TypeScript サポート

### 2. WebSocket vs HTTP Polling
- **決定**: Socket.io によるWebSocket通信
- **理由**: リアルタイム性、双方向通信、自動再接続

### 3. プロセス分離
- **決定**: 各セッションを独立したプロセスで実行
- **理由**: セキュリティ、リソース制限、障害分離

### 4. SQLite vs その他DB
- **決定**: SQLite3 による軽量なセッション永続化
- **理由**: シンプルな運用、ローカル実行、十分な性能

## アーキテクチャの特徴

### 1. リアルタイム通信
- Socket.io による双方向通信
- Amazon Q CLI の stdout/stderr をリアルタイムストリーミング
- 適切なバッファリングとエラーハンドリング

### 2. プロセス管理
- 子プロセスによる Amazon Q CLI の実行
- セッション単位でのプロセス分離
- 適切なクリーンアップとリソース管理

### 3. 型安全性
- TypeScript による厳密な型チェック
- @quincy/shared パッケージによる型共有
- フロントエンド・バックエンド間の型安全な通信

### 4. セキュリティ
- Amazon Q CLI への認証委譲
- プロセス分離による安全性確保
- 適切な入力検証と出力サニタイゼーション

## 開発・運用ガイド

### 開発環境セットアップ
```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動
pnpm dev:backend    # バックエンド (Port 3000)
pnpm dev:frontend   # フロントエンド (Port 4200)
```

### テスト実行
```bash
# バックエンドテスト
pnpm --filter backend test

# フロントエンドテスト
pnpm --filter frontend test
```

### 本番ビルド
```bash
# 全体ビルド
pnpm build

# 個別ビルド
pnpm build:backend
pnpm build:frontend
```

## 今後の拡張計画

### 短期的改善
- [ ] テストカバレッジの向上
- [ ] エラーハンドリングの強化
- [ ] パフォーマンス最適化
- [ ] セキュリティ強化

### 中期的改善
- [ ] マルチユーザー対応
- [ ] セッション共有機能
- [ ] 高度な履歴管理
- [ ] 管理者機能

### 長期的改善
- [ ] スケーラビリティの向上
- [ ] 他のAIアシスタントとの統合
- [ ] プラグインシステム
- [ ] 企業向け機能強化

## 参考リソース

### 外部ドキュメント
- [Amazon Q Developer CLI](https://github.com/aws/amazon-q-developer-cli)
- [Express.js Documentation](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/)
- [Angular Documentation](https://angular.dev/)

### 設計手法
- [C4 Model](https://c4model.com/)
- [Mermaid Diagram Syntax](https://mermaid.js.org/)
- [TypeScript Best Practices](https://www.typescriptlang.org/)

### セキュリティ
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [AWS Security Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/)

## 貢献

アーキテクチャの改善提案や新機能の提案は、以下の手順で行ってください：

1. 既存のドキュメントを確認
2. 技術的な実現可能性を検討
3. セキュリティ影響を評価
4. パフォーマンス影響を評価
5. 実装計画を策定
6. Pull Request を作成

## 更新履歴

- **2025-07-17**: 初版作成
  - システム全体アーキテクチャドキュメント
  - バックエンド詳細設計
  - API仕様書
  - セキュリティアーキテクチャ
  - 各種アーキテクチャ図（Mermaid）
  - デプロイメント図

---

このドキュメントは、Quincy プロジェクトの理解と開発を支援するために作成されました。不明な点やフィードバックがある場合は、GitHub Issue でお知らせください。