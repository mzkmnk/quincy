# Amazon Q Developer UI 技術仕様書

## プロジェクト概要
Amazon Q Developer CLIのためのWebベースのユーザーインターフェースを構築します。claudecodeuiをベースに、フロントエンドをAngular、バックエンドをHonoで実装します。

## 関連Issue
実装タスクの管理は[Issue #3](https://github.com/mzkmnk/quincy/issues/3)および関連する子Issueで行います。

## アーキテクチャ概要

### 全体構成
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Angular App   │────▶│  Hono Backend   │────▶│ Amazon Q CLI    │
│  (Frontend)     │◀────│   (API/WS)      │◀────│  (Process)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      │                          │                         │
      └── WebSocket ─────────────┘                         │
                                                          │
                                                    ┌──────▼──────┐
                                                    │ AWS IAM     │
                                                    │ Identity    │
                                                    │ Center      │
                                                    └─────────────┘
```

## フェーズ1: 基盤構築

### 1.1 バックエンド基盤
- [ ] Hono APIサーバーのセットアップ
  - CORS設定
  - エラーハンドリング
  - ロギング機構
- [ ] WebSocketサーバーの実装
  - Socket.io統合
  - イベントハンドラー設計
- [ ] プロジェクト管理モジュール
  - プロジェクトディレクトリスキャン
  - メタデータ管理

### 1.2 フロントエンド基盤
- [ ] Angularルーティング設定
- [ ] UIコンポーネントライブラリ選定
  - Angular Material or PrimeNG
- [ ] WebSocketクライアント実装
- [ ] 状態管理（NgRx or Akita）セットアップ

### 1.3 開発環境
- [ ] 開発用プロキシ設定
- [ ] ホットリロード設定
- [ ] TypeScript型定義共有

## フェーズ2: Amazon Q CLI統合

### 2.1 CLI プロセス管理
- [ ] Amazon Q CLIプロセス起動モジュール
  ```typescript
  interface QProcessOptions {
    sessionId?: string;
    workingDir: string;
    model?: string;
    resume?: boolean;
  }
  ```
- [ ] プロセスライフサイクル管理
- [ ] 標準入出力ストリーム処理
- [ ] エラーハンドリング

### 2.2 コマンド処理
- [ ] qコマンドパーサー実装
  - `q chat`
  - `q chat --resume`
  - `/usage`
  - `/compact`
- [ ] レスポンスパーシング
  - JSON形式の解析
  - ストリーミングレスポンス対応

### 2.3 セッション管理
- [ ] セッション永続化
  - ワーキングディレクトリ別管理
  - セッション履歴保存
- [ ] セッション復元機能
- [ ] コンテキスト管理

## フェーズ3: コア機能実装

### 3.1 チャットインターフェース
- [ ] チャットコンポーネント
  - メッセージ表示
  - Markdownレンダリング
  - コードハイライト
- [ ] 入力コンポーネント
  - マルチライン対応
  - ファイルアップロード
  - 音声入力（Whisper API）

### 3.2 ファイル管理
- [ ] ファイルエクスプローラー
  - ツリービュー表示
  - ファイル内容プレビュー
  - アイコン表示
- [ ] ファイルエディター
  - シンタックスハイライト
  - 保存機能
  - Diff表示

### 3.3 ターミナル統合
- [ ] Webターミナルコンポーネント
  - xterm.js統合
  - サイズ調整
  - カラー対応
- [ ] シェルセッション管理
- [ ] コマンド履歴

## フェーズ4: 高度な機能

### 4.1 プロジェクト管理
- [ ] プロジェクト一覧表示
- [ ] プロジェクト検索・フィルター
- [ ] プロジェクト設定管理
- [ ] 手動プロジェクト追加

### 4.2 セッション機能
- [ ] セッション一覧表示
- [ ] セッション検索
- [ ] セッションエクスポート/インポート
- [ ] セッション統計

### 4.3 ツール統合
- [ ] MCPサーバー対応
- [ ] カスタムツール設定
- [ ] ツール権限管理

## フェーズ5: UI/UX改善

### 5.1 レスポンシブデザイン
- [ ] モバイル対応
- [ ] タブレット対応
- [ ] タッチ操作最適化

### 5.2 テーマ・カスタマイズ
- [ ] ダークモード
- [ ] カスタムテーマ
- [ ] フォントサイズ調整

### 5.3 パフォーマンス最適化
- [ ] 遅延ロード
- [ ] 仮想スクロール
- [ ] WebSocketメッセージ最適化

## 技術仕様

### バックエンド（Hono）

#### APIエンドポイント
```typescript
// プロジェクト管理
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id

// セッション管理
GET    /api/projects/:projectId/sessions
GET    /api/projects/:projectId/sessions/:sessionId
POST   /api/projects/:projectId/sessions
DELETE /api/projects/:projectId/sessions/:sessionId

// ファイル管理
GET    /api/projects/:projectId/files
GET    /api/projects/:projectId/files/*path
PUT    /api/projects/:projectId/files/*path

// Amazon Q コマンド
POST   /api/q/chat
POST   /api/q/command

// 設定
GET    /api/config
PUT    /api/config
```

#### WebSocketイベント
```typescript
// クライアント → サーバー
'q:command'        // Qコマンド実行
'q:abort'          // セッション中断
'shell:init'       // ターミナル初期化
'shell:input'      // ターミナル入力
'shell:resize'     // ターミナルサイズ変更

// サーバー → クライアント
'q:response'       // Qレスポンス
'q:error'          // エラー
'q:complete'       // 完了
'project:update'   // プロジェクト更新
'shell:output'     // ターミナル出力
```

### フロントエンド（Angular）

#### コンポーネント構造
```
src/app/
├── core/
│   ├── services/
│   │   ├── amazon-q.service.ts
│   │   ├── project.service.ts
│   │   ├── websocket.service.ts
│   │   └── file.service.ts
│   └── guards/
├── features/
│   ├── chat/
│   │   ├── chat.component.ts
│   │   ├── message-list/
│   │   └── message-input/
│   ├── file-explorer/
│   │   ├── file-tree/
│   │   └── file-viewer/
│   ├── terminal/
│   └── projects/
├── shared/
│   ├── components/
│   └── pipes/
└── app.component.ts
```

## セキュリティ考慮事項

### 認証・認可
- Amazon Q CLIの既存認証を利用
- バックエンドはCLIプロセスを介してのみAWSリソースにアクセス
- セッション情報の暗号化

### ファイルアクセス
- ディレクトリトラバーサル対策
- 許可されたプロジェクトディレクトリのみアクセス可能
- ファイルサイズ制限

### プロセス管理
- 子プロセスの適切な終了処理
- リソース制限
- タイムアウト設定

## 懸念事項と対策

### 1. Amazon Q CLI認証
**懸念**: IAM Identity Centerの認証フローがWebUIから直接実行できない
**対策**: CLIの認証状態に依存し、未認証時は適切なガイダンスを表示

### 2. セッション管理
**懸念**: 長時間セッションのメモリ使用量
**対策**: 
- セッションのページネーション
- 古いメッセージの圧縮
- メモリ使用量モニタリング

### 3. リアルタイム通信
**懸念**: WebSocket接続の安定性
**対策**:
- 自動再接続機能
- 接続状態の視覚的フィードバック
- オフライン時の適切な処理

### 4. パフォーマンス
**懸念**: 大規模プロジェクトでのファイル一覧表示
**対策**:
- 遅延ロード
- ファイル数制限
- インデックス化

## 成功指標

1. **機能性**
   - Amazon Q CLIの主要機能がUIから利用可能
   - セッション永続化と復元が正常に動作
   - ファイル編集・保存が可能

2. **パフォーマンス**
   - 初期ロード時間 < 3秒
   - チャットレスポンス遅延 < 100ms
   - ファイル一覧表示 < 1秒

3. **ユーザビリティ**
   - モバイル/デスクトップ両対応
   - 直感的なUI/UX
   - エラー時の適切なフィードバック

## リスク管理

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| Amazon Q CLI仕様変更 | 高 | 中 | CLIバージョン固定、変更監視 |
| WebSocket接続不安定 | 中 | 中 | 再接続機能、ポーリングフォールバック |
| 大規模ファイルでのメモリ不足 | 中 | 低 | ストリーミング処理、ファイルサイズ制限 |
| セキュリティ脆弱性 | 高 | 低 | 定期的なセキュリティ監査、依存関係更新 |

## 今後の拡張可能性

1. **IDE統合**
   - VS Code拡張機能
   - JetBrains プラグイン

2. **コラボレーション機能**
   - セッション共有
   - リアルタイムコラボレーション

3. **AI機能拡張**
   - カスタムプロンプト管理
   - 応答のカスタマイズ

4. **分析・レポート**
   - 使用統計
   - コスト分析

## まとめ

このドキュメントは、Amazon Q Developer UIプロジェクトの技術仕様を定義しています。実際の実装タスクと進捗管理は、GitHubのIssueシステムを通じて行います。各フェーズの詳細なタスクは対応する子Issueで管理され、1Issue・1PRの原則に従って開発を進めます。