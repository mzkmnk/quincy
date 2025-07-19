# バックエンドリファクタリング実装計画書

**こちらは実装ごとにチェックボックスをつけて進捗がわかるようにすること**

## Phase 0: ログシステムの削除

### TODO リスト

- [x] ロギングシステムの完全削除
  - [x] `src/utils/logger.ts` ファイルを削除
  - [x] `amazon-q-cli.ts` の全ての `console.log` 呼び出しを削除（31箇所）
  - [x] `amazon-q-cli.ts` の全ての `console.error` 呼び出しを削除（4箇所）
  - [x] `amazon-q-cli.ts` の全ての `console.warn` 呼び出しを削除（3箇所）
  - [x] `websocket.ts` の全ての `console.log` 呼び出しを削除（33箇所）
  - [x] `websocket.ts` の全ての `console.error` 呼び出しを削除（11箇所）
  - [x] `websocket.ts` の全ての `console.warn` 呼び出しを削除（4箇所）
  - [x] `amazon-q-history.ts` の全ての `logger` インポートを削除
  - [x] `amazon-q-history.ts` の全ての `logger.info/warn/error` 呼び出しを削除（36箇所）
  - [x] `amazon-q-history-transformer.ts` の全ての `logger` インポートを削除
  - [x] `amazon-q-history-transformer.ts` の全ての `logger.error/warn/info` 呼び出しを削除（6箇所）
  - [x] `amazon-q-message-formatter.ts` の全ての `logger` インポートを削除
  - [x] `amazon-q-message-formatter.ts` の全ての `logger.error` 呼び出しを削除（2箇所）
  - [x] `index.ts` の `loggerMiddleware` インポートと使用を削除（2箇所）
  - [x] `utils/errors.ts` の `logger` インポートと使用を削除（2箇所）

## Phase 1: 共通ユーティリティの抽出と1ファイル1関数化

### TODO リスト

- [x] ID生成ユーティリティの作成（1ファイル1関数）
  - [x] `src/utils/id-generator/` ディレクトリを作成
  - [x] `src/utils/id-generator/generate-id.ts` ファイルを作成（基本関数）
  - [x] `src/utils/id-generator/generate-message-id.ts` ファイルを作成
  - [x] `src/utils/id-generator/generate-session-id.ts` ファイルを作成
  - [x] `src/utils/id-generator/index.ts` ファイルを作成（エクスポート集約）
  - [x] `websocket.ts` の `generateMessageId()` を新しいユーティリティに置き換え（4箇所）
  - [x] `amazon-q-cli.ts` の `generateSessionId()` を新しいユーティリティに置き換え（1箇所）
  - [x] `amazon-q-message-formatter.ts` の `generateMessageId()` を新しいユーティリティに置き換え（4箇所）
  - [x] 各ID生成関数のユニットテストを作成（12テストケース、全て成功）

- [x] パス検証ユーティリティの作成（1ファイル1関数）
  - [x] `src/utils/path-validator/` ディレクトリを作成
  - [x] `src/utils/path-validator/validate-project-path.ts` ファイルを作成
  - [x] `src/utils/path-validator/is-valid-path.ts` ファイルを作成
  - [x] `src/utils/path-validator/get-dangerous-paths.ts` ファイルを作成（定数）
  - [x] `src/utils/path-validator/check-path-traversal.ts` ファイルを作成
  - [x] `src/utils/path-validator/normalize-path.ts` ファイルを作成
  - [x] `src/utils/path-validator/index.ts` ファイルを作成（エクスポート集約）
  - [x] `amazon-q-cli.ts` の `validateProjectPath()` を新しいユーティリティに置き換え
  - [x] 各パス検証関数のユニットテストを作成

- [x] ANSI除去ユーティリティの作成（1ファイル1関数/定数）
  - [x] `src/utils/ansi-stripper/` ディレクトリを作成
  - [x] `src/utils/ansi-stripper/strip-ansi-codes.ts` ファイルを作成（メイン関数）
  - [x] `src/utils/ansi-stripper/index.ts` ファイルを作成（エクスポート集約）
  - [x] `amazon-q-cli.ts` の `stripAnsiCodes()` を新しいユーティリティに置き換え
  - [x] 各ANSI除去関数のユニットテストを作成

- [x] CLIパス検証ユーティリティの作成（1ファイル1関数）
  - [x] `src/utils/cli-validator/` ディレクトリを作成
  - [x] `src/utils/cli-validator/validate-cli-path.ts` ファイルを作成
  - [x] `src/utils/cli-validator/check-cli-availability.ts` ファイルを作成
  - [x] `src/utils/cli-validator/index.ts` ファイルを作成（エクスポート集約）
  - [x] `amazon-q-cli.ts` の `isValidCLIPath()` とCLI検証ロジックを移動
  - [x] 各CLI検証関数のユニットテストを作成

## Phase 2: Amazon Q CLIサービスの分割と1ファイル1関数化

### TODO リスト

- [x] Amazon Q CLIサービスディレクトリの作成
  - [x] `src/services/amazon-q-cli/` ディレクトリを作成
  - [x] 既存の `amazon-q-cli.ts` を削除（git管理のためバックアップ不要）

- [x] プロセス管理関数の分離（1ファイル1関数）
  - [x] `src/services/amazon-q-cli/process-manager/` ディレクトリを作成
  - [x] `src/services/amazon-q-cli/process-manager/spawn-process.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/process-manager/kill-process.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/process-manager/monitor-resources.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/process-manager/wait-for-process-start.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/process-manager/start-resource-monitoring.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/process-manager/update-all-session-resources.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/process-manager/cleanup-inactive-sessions.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/process-manager/setup-cleanup-handlers.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/process-manager/destroy.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/process-manager/index.ts` ファイルを作成（エクスポート集約）

- [x] セッション管理関数の分離（1ファイル1関数）
  - [x] `src/services/amazon-q-cli/session-manager/` ディレクトリを作成
  - [x] `src/services/amazon-q-cli/session-manager/types.ts` ファイルを作成（QProcessSession型など）
  - [x] `src/services/amazon-q-cli/session-manager/create-session.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/session-manager/get-session.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/session-manager/get-active-sessions.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/session-manager/get-session-runtime.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/session-manager/get-session-stats.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/session-manager/terminate-all-sessions.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/session-manager/update-session-resources.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/session-manager/send-input.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/session-manager/abort-session.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/session-manager/index.ts` ファイルを作成（エクスポート集約）

- [x] メッセージ処理関数の分離（1ファイル1関数）
  - [x] `src/services/amazon-q-cli/message-handler/` ディレクトリを作成
  - [x] `src/services/amazon-q-cli/message-handler/handle-stdout.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/handle-stderr.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/classify-stderr-message.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/get-info-message-type.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/should-skip-output.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/is-thinking-message.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/is-initialization-message.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/is-initialization-complete.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/should-skip-thinking.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/update-thinking-state.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/should-skip-duplicate-info.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/setup-process-handlers.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/message-handler/index.ts` ファイルを作成（エクスポート集約）

- [x] バッファ管理関数の分離（1ファイル1関数）
  - [x] `src/services/amazon-q-cli/buffer-manager/` ディレクトリを作成
  - [x] `src/services/amazon-q-cli/buffer-manager/flush-incomplete-output-line.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/buffer-manager/flush-incomplete-error-line.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/buffer-manager/flush-output-buffer.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/buffer-manager/add-to-initialization-buffer.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/buffer-manager/flush-initialization-buffer.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/buffer-manager/combine-initialization-messages.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/buffer-manager/index.ts` ファイルを作成（エクスポート集約）

- [x] CLI可用性チェック関数の分離（Phase 1で一部実装済み）
  - [x] `src/services/amazon-q-cli/cli-checker/` ディレクトリを作成
  - [x] `src/services/amazon-q-cli/cli-checker/check-cli-availability.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/cli-checker/build-command-args.ts` ファイルを作成
  - [x] `src/services/amazon-q-cli/cli-checker/index.ts` ファイルを作成（エクスポート集約）

- [x] メインサービスクラスの作成
  - [x] `src/services/amazon-q-cli/index.ts` ファイルを作成
  - [x] `AmazonQCLIService` クラスを再構築（各関数のインポートと統合）
  - [x] 既存の公開APIメソッドを維持（後方互換性）
  - [x] イベントエミッターの設定を維持
  - [x] 統合テストを作成

## Phase 3: WebSocketサービスの分割と1ファイル1関数化

### TODO リスト

- [x] WebSocketサービスディレクトリの作成
  - [x] `src/services/websocket/` ディレクトリを作成
  - [x] 既存の `websocket.ts` を削除（git管理のためバックアップ不要）

- [x] 接続管理関数の分離（1ファイル1関数）
  - [x] `src/services/websocket/connection-manager/` ディレクトリを作成
  - [x] `src/services/websocket/connection-manager/handle-connection.ts` ファイルを作成
  - [x] `src/services/websocket/connection-manager/handle-disconnection.ts` ファイルを作成
  - [x] `src/services/websocket/connection-manager/get-connected-users.ts` ファイルを作成
  - [x] `src/services/websocket/connection-manager/get-user-count.ts` ファイルを作成
  - [x] `src/services/websocket/connection-manager/connection-map.ts` ファイルを作成（connectedUsers Map）
  - [x] `src/services/websocket/connection-manager/index.ts` ファイルを作成（エクスポート集約）

- [x] ルーム管理関数の分離（1ファイル1関数）
  - [x] `src/services/websocket/room-manager/` ディレクトリを作成
  - [x] `src/services/websocket/room-manager/handle-room-join.ts` ファイルを作成
  - [x] `src/services/websocket/room-manager/handle-room-leave.ts` ファイルを作成
  - [x] `src/services/websocket/room-manager/get-room-users.ts` ファイルを作成
  - [x] `src/services/websocket/room-manager/broadcast-to-room.ts` ファイルを作成
  - [x] `src/services/websocket/room-manager/broadcast-to-all.ts` ファイルを作成
  - [x] `src/services/websocket/room-manager/room-map.ts` ファイルを作成（userRooms Map）
  - [x] `src/services/websocket/room-manager/index.ts` ファイルを作成（エクスポート集約）

- [x] Amazon Q統合関数の分離（1ファイル1関数）
  - [x] `src/services/websocket/amazon-q-handler/` ディレクトリを作成
  - [x] `src/services/websocket/amazon-q-handler/handle-q-command.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/handle-q-abort.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/handle-q-history.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/handle-q-history-detailed.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/handle-q-projects.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/handle-q-resume.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/handle-q-project-start.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/handle-q-message.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/add-socket-to-session.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/emit-to-session.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/cleanup-session.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/cleanup-socket-from-sessions.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/session-socket-map.ts` ファイルを作成（sessionToSockets Map）
  - [x] `src/services/websocket/amazon-q-handler/setup-q-cli-event-handlers.ts` ファイルを作成
  - [x] `src/services/websocket/amazon-q-handler/index.ts` ファイルを作成（エクスポート集約）

- [x] メッセージ処理関数の分離（1ファイル1関数）
  - [x] `src/services/websocket/message-handler/` ディレクトリを作成
  - [x] `src/services/websocket/message-handler/handle-message-send.ts` ファイルを作成
  - [x] `src/services/websocket/message-handler/index.ts` ファイルを作成（エクスポート集約）

- [x] エラー処理関数の分離（1ファイル1関数）
  - [x] `src/services/websocket/error-handler/` ディレクトリを作成
  - [x] `src/services/websocket/error-handler/send-error.ts` ファイルを作成
  - [x] `src/services/websocket/error-handler/setup-global-error-handling.ts` ファイルを作成
  - [x] `src/services/websocket/error-handler/index.ts` ファイルを作成（エクスポート集約）

- [x] イベント設定関数の分離
  - [x] `src/services/websocket/event-setup/` ディレクトリを作成
  - [x] `src/services/websocket/event-setup/setup-event-handlers.ts` ファイルを作成
  - [x] `src/services/websocket/event-setup/index.ts` ファイルを作成（エクスポート集約）

- [x] メインサービスクラスの再構築
  - [x] `src/services/websocket/index.ts` ファイルを作成
  - [x] `WebSocketService` クラスを再構築（各関数のインポートと統合）
  - [x] Socket.IO設定を維持（websocket.ts:39-56）
  - [x] 既存の公開APIメソッドを維持（後方互換性）
  - [x] 統合テストを作成

## Phase 4: 型定義の整理

### TODO リスト

- [x] 型定義ディレクトリの作成
  - [x] `src/types/` ディレクトリを作成

- [x] 共通型定義の作成
  - [x] `src/types/common.ts` ファイルを作成
  - [x] `MessageId` 型を定義（`msg_${string}`）
  - [x] `SessionId` 型を定義（`q_session_${string}`）
  - [x] `Timestamp` 型を定義（number）
  - [x] `ErrorCode` 型を定義（string literal union）
  - [x] ID生成ユーティリティで新しい型を使用するように更新

- [x] Amazon Q型定義の整理
  - [x] `src/types/amazon-q.ts` ファイルを作成
  - [x] `QProcessSession` インターフェースを移動・統合
  - [x] `QProcessOptions` インターフェースを移動・統合
  - [x] `QCommandEvent`、`QResponseEvent` などの型を統合
  - [x] Amazon Q関連の各種イベント型を定義
  - [x] 型ガード関数を追加
  - [x] `session-manager/types.ts` を新しい型定義を使用するように更新

- [x] WebSocket型定義の整理
  - [x] `src/types/websocket.ts` ファイルを作成
  - [x] `ConnectionInfo` 型を定義・拡張
  - [x] `RoomData`、`MessageData` 型を改善
  - [x] WebSocketイベント型を統合
  - [x] 型ガード関数を追加

- [x] 既存型定義ファイルの更新
  - [x] `src/types/index.ts` ファイルを作成（エクスポート集約）
  - [x] 既存の `amazon-q-history-types.ts` を index.ts からエクスポート
  - [x] 型定義のエクスポート構造を整理
  - [x] タイプチェックとビルド検証済み

## Phase 5: Amazon Q History関連サービスの分割と1ファイル1関数化

### TODO リスト

- [x] Amazon Q History サービスの分割（1ファイル1関数）
  - [x] `src/services/amazon-q-history/` ディレクトリを作成
  - [x] `src/services/amazon-q-history/get-project-history.ts` ファイルを作成
  - [x] `src/services/amazon-q-history/get-all-projects-history.ts` ファイルを作成
  - [x] `src/services/amazon-q-history/is-database-available.ts` ファイルを作成
  - [x] `src/services/amazon-q-history/find-by-conversation-id.ts` ファイルを作成
  - [x] `src/services/amazon-q-history/get-project-history-detailed.ts` ファイルを作成
  - [x] `src/services/amazon-q-history/get-conversation-stats.ts` ファイルを作成
  - [x] `src/services/amazon-q-history/get-all-projects-history-detailed.ts` ファイルを作成
  - [x] `src/services/amazon-q-history/constants.ts` ファイルを作成（dbPath定数など）
  - [x] `src/services/amazon-q-history/index.ts` ファイルを作成（エクスポート集約）
  - [x] 既存の `amazon-q-history.ts` を削除

- [x] Amazon Q History Transformer の分割（1ファイル1関数）
  - [x] `src/services/amazon-q-history-transformer/` ディレクトリを作成
  - [x] `src/services/amazon-q-history-transformer/group-conversation-turns.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/create-conversation-turn.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/extract-user-message.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/extract-ai-thinking.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/extract-ai-response.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/extract-metadata.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/extract-environment-info.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/extract-tools-used.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/extract-message-ids.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/is-valid-history-data.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/validate-history-entries.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/normalize-history-data.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/count-prompt-entries.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/get-transformation-stats.ts` ファイルを作成
  - [x] `src/services/amazon-q-history-transformer/index.ts` ファイルを作成（エクスポート集約）
  - [x] 既存の `amazon-q-history-transformer.ts` を削除

- [x] Amazon Q Message Formatter の分割（1ファイル1関数）
  - [x] `src/services/amazon-q-message-formatter/` ディレクトリを作成
  - [x] `src/services/amazon-q-message-formatter/convert-to-display-messages.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/format-user-message.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/format-thinking-messages.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/format-ai-response.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/format-thinking-content.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/get-tools-used-in-thinking-step.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/format-environment-info.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/format-tools-used.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/format-stats.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/truncate-content.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/format-markdown.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/filter-messages.ts` ファイルを作成
  - [x] `src/services/amazon-q-message-formatter/index.ts` ファイルを作成（エクスポート集約）
  - [x] 既存の `amazon-q-message-formatter.ts` を削除

## Phase 6: エラーハンドリングの統一と1ファイル1関数化

### TODO リスト

- [x] エラークラスの作成（1ファイル1クラス）
  - [x] `src/utils/errors/` ディレクトリを作成
  - [x] `src/utils/errors/app-error.ts` ファイルを作成（基底クラス）
  - [x] `src/utils/errors/validation-error.ts` ファイルを作成
  - [x] `src/utils/errors/not-found-error.ts` ファイルを作成
  - [x] `src/utils/errors/authentication-error.ts` ファイルを作成
  - [x] `src/utils/errors/process-error.ts` ファイルを作成
  - [x] `src/utils/errors/websocket-error.ts` ファイルを作成
  - [x] `src/utils/errors/error-codes.ts` ファイルを作成（エラーコード定数）
  - [x] `src/utils/errors/index.ts` ファイルを作成（エクスポート集約）

- [x] エラーファクトリーの作成（1ファイル1関数）
  - [x] `src/utils/error-factory/` ディレクトリを作成
  - [x] `src/utils/error-factory/create-validation-error.ts` ファイルを作成
  - [x] `src/utils/error-factory/create-not-found-error.ts` ファイルを作成
  - [x] `src/utils/error-factory/create-authentication-error.ts` ファイルを作成
  - [x] `src/utils/error-factory/create-process-error.ts` ファイルを作成
  - [x] `src/utils/error-factory/create-websocket-error.ts` ファイルを作成
  - [x] `src/utils/error-factory/index.ts` ファイルを作成（エクスポート集約）

- [x] 統一エラーハンドラーの作成
  - [x] `src/utils/errors/unified-error-handler.ts` ファイルを作成
  - [x] Express用の統一エラーハンドリングミドルウェアを実装
  - [x] WebSocket用のエラーハンドラーを実装
  - [x] クライアントへの一貫したエラーレスポンス形式を定義

- [x] 既存エラーハンドリングの置き換え
  - [x] `src/utils/errors.ts` のエラー関連機能を新しい構造に移行
  - [x] 後方互換性を保ちつつ新しいシステムを統合
  - [x] 型ガード関数とユーティリティ関数を追加
  - [x] タイプチェックとビルド検証済み

## 全フェーズ共通のTODO

- [x] 各フェーズ完了後のコードレビュー
- [x] 結合テストの実施
  - [x] Amazon Q CLI サービスの統合テスト作成
  - [x] WebSocket サービスの統合テスト作成
  - [x] Amazon Q CLI と WebSocket の結合テスト作成
  - [x] End-to-End テストでWebSocket経由のAmazon Q機能を検証
- [x] パフォーマンステストの実施
  - [x] ID生成パフォーマンステスト作成・実行
  - [x] ANSI除去パフォーマンステスト作成・実行
  - [x] パス検証パフォーマンステスト作成・実行
  - [x] CLI検証パフォーマンステスト作成・実行
  - [x] サービス初期化パフォーマンステスト作成・実行
  - [x] メモリ使用量テスト作成・実行
  - [x] 並行処理パフォーマンステスト作成・実行
  - [x] エラーハンドリングパフォーマンステスト作成・実行
  - [x] 型チェックパフォーマンステスト作成・実行
  - [x] 関数呼び出しオーバーヘッドテスト作成・実行
- [x] ドキュメントの更新
  - [x] アーキテクチャ図の作成/更新
    - [x] 全体構成図の作成（Mermaid形式）
    - [x] バックエンドサービス詳細構成図の作成
    - [x] Amazon Q CLI サービス詳細図の作成
    - [x] WebSocket サービス詳細図の作成
    - [x] データフロー図の作成
    - [x] テストアーキテクチャ図の作成
  - [x] APIドキュメントの更新
    - [x] RESTful API ドキュメント作成
    - [x] WebSocket API ドキュメント作成
    - [x] 全イベント仕様書作成
    - [x] エラーハンドリング仕様書作成
    - [x] 型定義ドキュメント作成
    - [x] 使用例とコードサンプル作成
  - [x] 開発者ガイドの作成
    - [x] 開発環境セットアップガイド作成
    - [x] アーキテクチャ原則説明作成
    - [x] コード規約定義作成
    - [x] テスト戦略ガイド作成
    - [x] 新機能追加ガイド作成
    - [x] トラブルシューティングガイド作成
- [x] CLAUDE.mdファイルの更新（新しいプロジェクト構造を反映）
  - [x] リファクタリング後のアーキテクチャ説明追加
  - [x] モジュール構造説明追加
  - [x] 開発ガイドライン追加
  - [x] テスト構造説明更新

---

_最終更新日: 2025-07-18_

## 🎉 バックエンドリファクタリング完了！

**全フェーズ完了**: 6つのフェーズすべてが完了し、1ファイル1関数アーキテクチャへの移行が完了しました。

### 達成された主な成果

1. **完全なモジュール化**: すべてのサービスが1ファイル1関数原則に従って再構築
2. **包括的なテストカバレッジ**: 単体テスト、統合テスト、E2Eテスト、パフォーマンステストを完備
3. **詳細なドキュメント**: アーキテクチャ図、APIドキュメント、開発者ガイドを完備
4. **統一されたエラーハンドリング**: 全サービスで一貫したエラーハンドリング
5. **型安全性の向上**: 厳密な型定義とTypeScript活用
6. **パフォーマンス最適化**: 高速な関数実行とメモリ効率の改善

### リファクタリング統計

- **作成されたファイル数**: 100+ ファイル（1ファイル1関数原則）
- **テストカバレッジ**: 全主要機能をカバー
- **パフォーマンス**: 各種操作で高速実行を確認
- **ドキュメント**: 完全なドキュメントセット作成

このリファクタリングにより、保守性、テスト容易性、拡張性が大幅に向上しました。
