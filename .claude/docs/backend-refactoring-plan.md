# バックエンドリファクタリング実装計画書

**こちらは実装ごとにチェックボックスをつけて進捗がわかるようにすること**

## Phase 0: ログシステムの削除

### TODO リスト

- [ ] ロギングシステムの完全削除
  - [ ] `src/utils/logger.ts` ファイルを削除
  - [ ] `amazon-q-cli.ts` の全ての `console.log` 呼び出しを削除（約50箇所）
  - [ ] `amazon-q-cli.ts` の全ての `console.error` 呼び出しを削除（約15箇所）
  - [ ] `amazon-q-cli.ts` の全ての `console.warn` 呼び出しを削除（約10箇所）
  - [ ] `websocket.ts` の全ての `console.log` 呼び出しを削除（約25箇所）
  - [ ] `websocket.ts` の全ての `console.error` 呼び出しを削除（約8箇所）
  - [ ] `amazon-q-history.ts` の全ての `logger` インポートを削除
  - [ ] `amazon-q-history.ts` の全ての `logger.info/warn/error` 呼び出しを削除
  - [ ] `amazon-q-history-transformer.ts` の全ての `logger` インポートを削除
  - [ ] `amazon-q-history-transformer.ts` の全ての `logger.error/warn` 呼び出しを削除
  - [ ] `amazon-q-message-formatter.ts` の全ての `logger` インポートを削除
  - [ ] `amazon-q-message-formatter.ts` の全ての `logger.error` 呼び出しを削除
  - [ ] `index.ts` の `loggerMiddleware` インポートと使用を削除

## Phase 1: 共通ユーティリティの抽出と1ファイル1関数化

### TODO リスト

- [ ] ID生成ユーティリティの作成（1ファイル1関数）
  - [ ] `src/utils/id-generator/` ディレクトリを作成
  - [ ] `src/utils/id-generator/generate-id.ts` ファイルを作成（基本関数）
  - [ ] `src/utils/id-generator/generate-message-id.ts` ファイルを作成
  - [ ] `src/utils/id-generator/generate-session-id.ts` ファイルを作成
  - [ ] `src/utils/id-generator/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `websocket.ts:344` の `generateMessageId()` を新しいユーティリティに置き換え
  - [ ] `amazon-q-cli.ts:786` の `generateSessionId()` を新しいユーティリティに置き換え
  - [ ] `amazon-q-message-formatter.ts:195` の `generateMessageId()` を新しいユーティリティに置き換え
  - [ ] 各ID生成関数のユニットテストを作成

- [ ] パス検証ユーティリティの作成（1ファイル1関数）
  - [ ] `src/utils/path-validator/` ディレクトリを作成
  - [ ] `src/utils/path-validator/validate-project-path.ts` ファイルを作成
  - [ ] `src/utils/path-validator/is-valid-path.ts` ファイルを作成
  - [ ] `src/utils/path-validator/get-dangerous-paths.ts` ファイルを作成（定数）
  - [ ] `src/utils/path-validator/check-path-traversal.ts` ファイルを作成
  - [ ] `src/utils/path-validator/normalize-path.ts` ファイルを作成
  - [ ] `src/utils/path-validator/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `amazon-q-cli.ts:83-151` の `validateProjectPath()` を新しいユーティリティに置き換え
  - [ ] 各パス検証関数のユニットテストを作成

- [ ] ANSI除去ユーティリティの作成（1ファイル1関数/定数）
  - [ ] `src/utils/ansi-stripper/` ディレクトリを作成
  - [ ] `src/utils/ansi-stripper/remove-ansi-codes.ts` ファイルを作成（メイン関数）
  - [ ] `src/utils/ansi-stripper/spinner-chars.ts` ファイルを作成（定数）
  - [ ] `src/utils/ansi-stripper/progress-bar-chars.ts` ファイルを作成（定数）
  - [ ] `src/utils/ansi-stripper/ansi-patterns.ts` ファイルを作成（正規表現パターン）
  - [ ] `src/utils/ansi-stripper/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `amazon-q-cli.ts:868-935` の `stripAnsiCodes()` を新しいユーティリティに置き換え
  - [ ] 各ANSI除去関数のユニットテストを作成

- [ ] CLIパス検証ユーティリティの作成（1ファイル1関数）
  - [ ] `src/utils/cli-validator/` ディレクトリを作成
  - [ ] `src/utils/cli-validator/is-valid-cli-path.ts` ファイルを作成
  - [ ] `src/utils/cli-validator/execute-secure-cli.ts` ファイルを作成
  - [ ] `src/utils/cli-validator/cli-candidates.ts` ファイルを作成（定数）
  - [ ] `src/utils/cli-validator/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `amazon-q-cli.ts:159-186` の `isValidCLIPath()` を移動
  - [ ] `amazon-q-cli.ts:191-207` の `executeSecureCLI()` を移動
  - [ ] 各CLI検証関数のユニットテストを作成

## Phase 2: Amazon Q CLIサービスの分割と1ファイル1関数化

### TODO リスト

- [ ] Amazon Q CLIサービスディレクトリの作成
  - [ ] `src/services/amazon-q-cli/` ディレクトリを作成
  - [ ] 既存の `amazon-q-cli.ts` を `amazon-q-cli.bak.ts` にリネーム（バックアップ）

- [ ] プロセス管理関数の分離（1ファイル1関数）
  - [ ] `src/services/amazon-q-cli/process-manager/` ディレクトリを作成
  - [ ] `src/services/amazon-q-cli/process-manager/spawn-process.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/process-manager/kill-process.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/process-manager/monitor-resources.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/process-manager/wait-for-process-start.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/process-manager/start-resource-monitoring.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/process-manager/update-all-session-resources.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/process-manager/cleanup-inactive-sessions.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/process-manager/setup-cleanup-handlers.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/process-manager/destroy.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/process-manager/index.ts` ファイルを作成（エクスポート集約）

- [ ] セッション管理関数の分離（1ファイル1関数）
  - [ ] `src/services/amazon-q-cli/session-manager/` ディレクトリを作成
  - [ ] `src/services/amazon-q-cli/session-manager/types.ts` ファイルを作成（QProcessSession型など）
  - [ ] `src/services/amazon-q-cli/session-manager/create-session.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/session-manager/get-session.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/session-manager/get-active-sessions.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/session-manager/get-session-runtime.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/session-manager/get-session-stats.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/session-manager/terminate-all-sessions.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/session-manager/update-session-resources.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/session-manager/send-input.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/session-manager/abort-session.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/session-manager/index.ts` ファイルを作成（エクスポート集約）

- [ ] メッセージ処理関数の分離（1ファイル1関数）
  - [ ] `src/services/amazon-q-cli/message-handler/` ディレクトリを作成
  - [ ] `src/services/amazon-q-cli/message-handler/handle-stdout.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/handle-stderr.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/classify-stderr-message.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/get-info-message-type.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/should-skip-output.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/is-thinking-message.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/is-initialization-message.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/is-initialization-complete.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/should-skip-thinking.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/update-thinking-state.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/should-skip-duplicate-info.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/setup-process-handlers.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/message-handler/index.ts` ファイルを作成（エクスポート集約）

- [ ] バッファ管理関数の分離（1ファイル1関数）
  - [ ] `src/services/amazon-q-cli/buffer-manager/` ディレクトリを作成
  - [ ] `src/services/amazon-q-cli/buffer-manager/flush-incomplete-output-line.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/buffer-manager/flush-incomplete-error-line.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/buffer-manager/flush-output-buffer.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/buffer-manager/add-to-initialization-buffer.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/buffer-manager/flush-initialization-buffer.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/buffer-manager/combine-initialization-messages.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/buffer-manager/index.ts` ファイルを作成（エクスポート集約）

- [ ] CLI可用性チェック関数の分離（Phase 1で一部実装済み）
  - [ ] `src/services/amazon-q-cli/cli-checker/` ディレクトリを作成
  - [ ] `src/services/amazon-q-cli/cli-checker/check-cli-availability.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/cli-checker/build-command-args.ts` ファイルを作成
  - [ ] `src/services/amazon-q-cli/cli-checker/index.ts` ファイルを作成（エクスポート集約）

- [ ] メインサービスクラスの作成
  - [ ] `src/services/amazon-q-cli/index.ts` ファイルを作成
  - [ ] `AmazonQCLIService` クラスを再構築（各関数のインポートと統合）
  - [ ] 既存の公開APIメソッドを維持（後方互換性）
  - [ ] イベントエミッターの設定を維持
  - [ ] 統合テストを作成

## Phase 3: WebSocketサービスの分割と1ファイル1関数化

### TODO リスト

- [ ] WebSocketサービスディレクトリの作成
  - [ ] `src/services/websocket/` ディレクトリを作成
  - [ ] 既存の `websocket.ts` を `websocket.bak.ts` にリネーム（バックアップ）

- [ ] 接続管理関数の分離（1ファイル1関数）
  - [ ] `src/services/websocket/connection-manager/` ディレクトリを作成
  - [ ] `src/services/websocket/connection-manager/handle-connection.ts` ファイルを作成
  - [ ] `src/services/websocket/connection-manager/handle-disconnection.ts` ファイルを作成
  - [ ] `src/services/websocket/connection-manager/get-connected-users.ts` ファイルを作成
  - [ ] `src/services/websocket/connection-manager/get-user-count.ts` ファイルを作成
  - [ ] `src/services/websocket/connection-manager/connection-map.ts` ファイルを作成（connectedUsers Map）
  - [ ] `src/services/websocket/connection-manager/index.ts` ファイルを作成（エクスポート集約）

- [ ] ルーム管理関数の分離（1ファイル1関数）
  - [ ] `src/services/websocket/room-manager/` ディレクトリを作成
  - [ ] `src/services/websocket/room-manager/handle-room-join.ts` ファイルを作成
  - [ ] `src/services/websocket/room-manager/handle-room-leave.ts` ファイルを作成
  - [ ] `src/services/websocket/room-manager/get-room-users.ts` ファイルを作成
  - [ ] `src/services/websocket/room-manager/broadcast-to-room.ts` ファイルを作成
  - [ ] `src/services/websocket/room-manager/broadcast-to-all.ts` ファイルを作成
  - [ ] `src/services/websocket/room-manager/room-map.ts` ファイルを作成（userRooms Map）
  - [ ] `src/services/websocket/room-manager/index.ts` ファイルを作成（エクスポート集約）

- [ ] Amazon Q統合関数の分離（1ファイル1関数）
  - [ ] `src/services/websocket/amazon-q-handler/` ディレクトリを作成
  - [ ] `src/services/websocket/amazon-q-handler/handle-q-command.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/handle-q-abort.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/handle-q-history.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/handle-q-history-detailed.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/handle-q-projects.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/handle-q-resume.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/handle-q-project-start.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/handle-q-message.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/add-socket-to-session.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/emit-to-session.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/cleanup-session.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/cleanup-socket-from-sessions.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/session-socket-map.ts` ファイルを作成（sessionToSockets Map）
  - [ ] `src/services/websocket/amazon-q-handler/setup-q-cli-event-handlers.ts` ファイルを作成
  - [ ] `src/services/websocket/amazon-q-handler/index.ts` ファイルを作成（エクスポート集約）

- [ ] メッセージ処理関数の分離（1ファイル1関数）
  - [ ] `src/services/websocket/message-handler/` ディレクトリを作成
  - [ ] `src/services/websocket/message-handler/handle-message-send.ts` ファイルを作成
  - [ ] `src/services/websocket/message-handler/index.ts` ファイルを作成（エクスポート集約）

- [ ] エラー処理関数の分離（1ファイル1関数）
  - [ ] `src/services/websocket/error-handler/` ディレクトリを作成
  - [ ] `src/services/websocket/error-handler/send-error.ts` ファイルを作成
  - [ ] `src/services/websocket/error-handler/setup-global-error-handling.ts` ファイルを作成
  - [ ] `src/services/websocket/error-handler/index.ts` ファイルを作成（エクスポート集約）

- [ ] イベント設定関数の分離
  - [ ] `src/services/websocket/event-setup/` ディレクトリを作成
  - [ ] `src/services/websocket/event-setup/setup-event-handlers.ts` ファイルを作成
  - [ ] `src/services/websocket/event-setup/index.ts` ファイルを作成（エクスポート集約）

- [ ] メインサービスクラスの再構築
  - [ ] `src/services/websocket/index.ts` ファイルを作成
  - [ ] `WebSocketService` クラスを再構築（各関数のインポートと統合）
  - [ ] Socket.IO設定を維持（websocket.ts:39-56）
  - [ ] 既存の公開APIメソッドを維持（後方互換性）
  - [ ] 統合テストを作成

## Phase 4: 型定義の整理

### TODO リスト

- [ ] 型定義ディレクトリの作成
  - [ ] `src/types/` ディレクトリを作成

- [ ] 共通型定義の作成
  - [ ] `src/types/common.ts` ファイルを作成
  - [ ] `MessageId` 型を定義（`msg_${string}`）
  - [ ] `SessionId` 型を定義（`q_session_${string}`）
  - [ ] `Timestamp` 型を定義（number）
  - [ ] `ErrorCode` 型を定義（string literal union）
  - [ ] 全ファイルでこれらの型を使用するように更新

- [ ] Amazon Q型定義の整理
  - [ ] `src/types/amazon-q.ts` ファイルを作成
  - [ ] `@quincy/shared` から重複している型定義を確認
  - [ ] `QProcessSession` インターフェース（amazon-q-cli.ts:14-44）を移動
  - [ ] `QProcessOptions` インターフェース（amazon-q-cli.ts:46-52）を移動
  - [ ] `QCommandEvent`、`QResponseEvent` などの型を統合
  - [ ] Amazon Q履歴関連の型（amazon-q-history-types.ts）との整合性を確認
  - [ ] 全てのAmazon Q関連ファイルで新しい型定義を使用

- [ ] WebSocket型定義の整理
  - [ ] `src/types/websocket.ts` ファイルを作成
  - [ ] `ConnectionInfo` 型（`@quincy/shared`から）の確認と必要に応じた拡張
  - [ ] `RoomData`、`MessageData` 型の確認と改善
  - [ ] Socket.IOのジェネリック型パラメータの整理
  - [ ] 全てのWebSocket関連ファイルで新しい型定義を使用

- [ ] 既存型定義ファイルの更新
  - [ ] `amazon-q-history-types.ts` の型定義を確認し、共通型との整合性を保つ
  - [ ] `@quincy/shared` パッケージの型定義との重複を解消
  - [ ] 型定義のエクスポート構造を整理

## Phase 5: Amazon Q History関連サービスの分割と1ファイル1関数化

### TODO リスト

- [ ] Amazon Q History サービスの分割（1ファイル1関数）
  - [ ] `src/services/amazon-q-history/` ディレクトリを作成
  - [ ] `src/services/amazon-q-history/get-project-history.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history/get-all-projects-history.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history/is-database-available.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history/find-by-conversation-id.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history/get-project-history-detailed.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history/get-conversation-stats.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history/get-all-projects-history-detailed.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history/constants.ts` ファイルを作成（dbPath定数など）
  - [ ] `src/services/amazon-q-history/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存の `amazon-q-history.ts` を削除

- [ ] Amazon Q History Transformer の分割（1ファイル1関数）
  - [ ] `src/services/amazon-q-history-transformer/` ディレクトリを作成
  - [ ] `src/services/amazon-q-history-transformer/group-conversation-turns.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/create-conversation-turn.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/extract-user-message.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/extract-ai-thinking.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/extract-ai-response.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/extract-metadata.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/extract-environment-info.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/extract-tools-used.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/extract-message-ids.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/is-valid-history-data.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/validate-history-entries.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/normalize-history-data.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/count-prompt-entries.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/get-transformation-stats.ts` ファイルを作成
  - [ ] `src/services/amazon-q-history-transformer/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存の `amazon-q-history-transformer.ts` を削除

- [ ] Amazon Q Message Formatter の分割（1ファイル1関数）
  - [ ] `src/services/amazon-q-message-formatter/` ディレクトリを作成
  - [ ] `src/services/amazon-q-message-formatter/convert-to-display-messages.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/format-user-message.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/format-thinking-messages.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/format-ai-response.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/format-thinking-content.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/get-tools-used-in-thinking-step.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/format-environment-info.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/format-tools-used.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/format-stats.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/truncate-content.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/format-markdown.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/filter-messages.ts` ファイルを作成
  - [ ] `src/services/amazon-q-message-formatter/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存の `amazon-q-message-formatter.ts` を削除

## Phase 6: エラーハンドリングの統一と1ファイル1関数化

### TODO リスト

- [ ] エラークラスの作成（1ファイル1クラス）
  - [ ] `src/utils/errors/` ディレクトリを作成
  - [ ] `src/utils/errors/app-error.ts` ファイルを作成（基底クラス）
  - [ ] `src/utils/errors/validation-error.ts` ファイルを作成
  - [ ] `src/utils/errors/not-found-error.ts` ファイルを作成
  - [ ] `src/utils/errors/authentication-error.ts` ファイルを作成
  - [ ] `src/utils/errors/process-error.ts` ファイルを作成
  - [ ] `src/utils/errors/websocket-error.ts` ファイルを作成
  - [ ] `src/utils/errors/error-codes.ts` ファイルを作成（エラーコード定数）
  - [ ] `src/utils/errors/index.ts` ファイルを作成（エクスポート集約）

- [ ] エラーファクトリーの作成（1ファイル1関数）
  - [ ] `src/utils/error-factory/` ディレクトリを作成
  - [ ] `src/utils/error-factory/create-validation-error.ts` ファイルを作成
  - [ ] `src/utils/error-factory/create-not-found-error.ts` ファイルを作成
  - [ ] `src/utils/error-factory/create-authentication-error.ts` ファイルを作成
  - [ ] `src/utils/error-factory/create-process-error.ts` ファイルを作成
  - [ ] `src/utils/error-factory/create-websocket-error.ts` ファイルを作成
  - [ ] `src/utils/error-factory/index.ts` ファイルを作成（エクスポート集約）

- [ ] 統一エラーハンドラーの作成
  - [ ] `src/middleware/error-handler.ts` を削除（既存のエラーハンドラー）
  - [ ] `src/utils/errors.ts` のエラー関連機能を新しい構造に移行
  - [ ] クライアントへの一貫したエラーレスポンス形式を定義

- [ ] 既存エラーハンドリングの置き換え
  - [ ] Amazon Q CLIサービスの全エラーハンドリングを統一形式に変更
  - [ ] WebSocketサービスの全エラーハンドリングを統一形式に変更
  - [ ] ルートハンドラーの全エラーハンドリングを統一形式に変更
  - [ ] エラーハンドリングの統合テストを作成

## 全フェーズ共通のTODO

- [ ] 各フェーズ完了後のコードレビュー
- [ ] パフォーマンステストの実施
- [ ] ドキュメントの更新
  - [ ] アーキテクチャ図の作成/更新
  - [ ] APIドキュメントの更新
  - [ ] 開発者ガイドの作成
- [ ] CLAUDE.mdファイルの更新（新しいプロジェクト構造を反映）

---

*最終更新日: 2025-07-17*