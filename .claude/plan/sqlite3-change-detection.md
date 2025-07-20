# SQLite3変更検知機能実装TODO

## 概要
Amazon Q履歴データベース（data.sqlite3）の変更をリアルタイムで検知し、WebSocket経由でフロントエンドに通知する機能を実装する。

## 技術選択
- **ライブラリ**: chokidar（ファイル監視）
- **理由**: 安定性、クロスプラットフォーム対応、デバウンス機能内蔵

## 実装タスク

### 1. 依存関係の追加
- [ ] `pnpm add chokidar @types/chokidar`でライブラリをインストール
- [ ] package.jsonの依存関係を確認

### 2. バックエンド：データベース監視サービスの作成
- [ ] `apps/backend/src/services/amazon-q-history/database-watcher/`ディレクトリを作成
- [ ] `watch-database.ts`: chokidarを使用したファイル監視機能
  - データベースファイルパスの取得
  - chokidar watcherの設定
  - 変更イベントのハンドリング
- [ ] `database-change-handler.ts`: 変更検知時の処理
  - デバウンス処理（短時間での複数変更を統合）
  - 変更種別の判定（追加、更新、削除）
  - WebSocketへの通知トリガー
- [ ] `index.ts`: モジュールのエクスポート

### 3. バックエンド：WebSocket通知機能の統合
- [ ] `apps/backend/src/services/websocket/amazon-q-handler/`に新しいハンドラーを追加
- [ ] `handle-database-change.ts`: データベース変更通知ハンドラー
  - 接続中のクライアントへの通知
  - 通知データの形式定義
- [ ] 既存のWebSocketイベント設定に統合
- [ ] `apps/backend/src/types/websocket.ts`に新しいイベント型を追加

### 4. バックエンド：設定とエラーハンドリング
- [ ] `apps/backend/src/utils/database-watcher-config/`に設定管理を作成
- [ ] 監視の有効/無効設定
- [ ] 監視間隔の設定（デバウンス時間）
- [ ] ファイルアクセスエラーの適切な処理
- [ ] ログ出力の実装

### 5. フロントエンド：WebSocket受信処理
- [ ] `apps/frontend/src/app/core/services/websocket/`に新しいハンドラーを追加
- [ ] `database-change/`ディレクトリを作成
- [ ] `handle-database-change.ts`: データベース変更通知の受信処理
- [ ] 履歴データの自動リフレッシュ機能
- [ ] `apps/frontend/src/app/core/types/websocket.types.ts`に型定義を追加

### 6. フロントエンド：UI更新機能
- [ ] Amazon Q履歴コンポーネントの自動更新機能
- [ ] 新しい履歴項目の通知表示
- [ ] 状態管理（@ngrx/signals）の更新

### 7. テストの作成
- [ ] `apps/backend/src/tests/database-watcher.test.ts`: ファイル監視のユニットテスト
- [ ] `apps/backend/src/tests/database-change-integration.test.ts`: 統合テスト
- [ ] `apps/frontend/src/app/core/services/websocket/database-change/database-change.spec.ts`: フロントエンドテスト

### 8. ドキュメント更新
- [ ] CLAUDE.mdに新機能の説明を追加
- [ ] 設定方法と使用方法の記載

## 技術的考慮事項

### パフォーマンス
- デバウンス時間: 500ms（短時間での複数変更を統合）
- ファイル監視の効率化（ignoreInitialフラグの活用）
- メモリリークの防止（適切なwatcher.close()）

### エラーハンドリング
- ファイルアクセス権限エラー
- ファイルが存在しない場合の処理
- WebSocket接続エラー時の再試行

### セキュリティ
- ファイルパスの検証
- 許可されたファイルのみの監視

### 互換性
- macOS, Windows, Linuxでの動作確認
- Node.jsバージョン互換性

## 実装順序
1. 依存関係の追加
2. バックエンドの監視サービス作成
3. WebSocket通知機能の実装
4. フロントエンド受信処理の実装
5. UI更新機能の実装
6. テストの作成
7. ドキュメント更新

## 期待される効果
- Amazon Q CLIで新しい会話が作成された際のリアルタイム反映
- ユーザー体験の向上（手動リフレッシュが不要）
- 履歴データの最新状態の保証