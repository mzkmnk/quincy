# フロントエンドリファクタリング実装計画書

**こちらは実装ごとにチェックボックスをつけて進捗がわかるようにすること**

## Phase 1: 共通ユーティリティの抽出と1ファイル1関数化

### TODO リスト

- [ ] バリデーターユーティリティの作成（1ファイル1関数）
  - [ ] `src/app/shared/utils/validators/` ディレクトリを作成
  - [ ] `src/app/shared/utils/validators/path-validator.ts` ファイルを作成
  - [ ] `src/app/shared/utils/validators/message-validator.ts` ファイルを作成
  - [ ] `src/app/shared/utils/validators/session-validator.ts` ファイルを作成
  - [ ] `src/app/shared/utils/validators/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `path-selector.component.ts` の `validatePath()` ロジックを移動（91-108行）
  - [ ] 各バリデーター関数のユニットテストを作成

- [ ] フォーマッターユーティリティの作成（1ファイル1関数）
  - [ ] `src/app/shared/utils/formatters/` ディレクトリを作成
  - [ ] `src/app/shared/utils/formatters/message-formatter.ts` ファイルを作成
  - [ ] `src/app/shared/utils/formatters/date-formatter.ts` ファイルを作成
  - [ ] `src/app/shared/utils/formatters/path-formatter.ts` ファイルを作成
  - [ ] `src/app/shared/utils/formatters/info-message-formatter.ts` ファイルを作成
  - [ ] `src/app/shared/utils/formatters/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `chat.component.ts` の `formatInfoMessage()` を移動（516-529行）
  - [ ] 各フォーマッター関数のユニットテストを作成

- [ ] コンバーターユーティリティの作成（1ファイル1関数）
  - [ ] `src/app/shared/utils/converters/` ディレクトリを作成
  - [ ] `src/app/shared/utils/converters/display-message-converter.ts` ファイルを作成
  - [ ] `src/app/shared/utils/converters/chat-message-converter.ts` ファイルを作成
  - [ ] `src/app/shared/utils/converters/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `message-list.component.ts` の `convertDisplayMessagesToChatMessages()` を移動（210-222行）
  - [ ] 各コンバーター関数のユニットテストを作成

- [ ] ジェネレーターユーティリティの作成（1ファイル1関数）
  - [ ] `src/app/shared/utils/generators/` ディレクトリを作成
  - [ ] `src/app/shared/utils/generators/id-generator.ts` ファイルを作成
  - [ ] `src/app/shared/utils/generators/timestamp-generator.ts` ファイルを作成
  - [ ] `src/app/shared/utils/generators/welcome-message-generator.ts` ファイルを作成
  - [ ] `src/app/shared/utils/generators/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `message-list.component.ts` の `getWelcomeMessage()` を移動（225-235行）
  - [ ] 各ジェネレーター関数のユニットテストを作成

## Phase 2: WebSocketサービスの分割と1ファイル1関数化

### TODO リスト

- [ ] WebSocketサービスディレクトリの作成
  - [ ] `src/app/core/services/websocket/` ディレクトリを作成
  - [ ] 既存の `websocket.service.ts` のバックアップ作成

- [ ] 接続管理関数の分離（1ファイル1関数）
  - [ ] `src/app/core/services/websocket/connection/` ディレクトリを作成
  - [ ] `src/app/core/services/websocket/connection/connect.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/connection/disconnect.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/connection/emit.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/connection/on.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/connection/off.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/connection/connection-state.ts` ファイルを作成（signal管理）
  - [ ] `src/app/core/services/websocket/connection/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存の接続管理メソッドを新しい関数に置き換え（29-59行）
  - [ ] 各接続管理関数のユニットテストを作成

- [ ] Amazon Q履歴管理関数の分離（1ファイル1関数）
  - [ ] `src/app/core/services/websocket/amazon-q-history/` ディレクトリを作成
  - [ ] `src/app/core/services/websocket/amazon-q-history/get-project-history.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/amazon-q-history/get-all-projects-history.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/amazon-q-history/get-conversation-details.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/amazon-q-history/setup-history-listeners.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/amazon-q-history/remove-history-listeners.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/amazon-q-history/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存の履歴管理メソッドを新しい関数に置き換え（84-154行）
  - [ ] 各履歴管理関数のユニットテストを作成

- [ ] チャット管理関数の分離（1ファイル1関数）
  - [ ] `src/app/core/services/websocket/chat/` ディレクトリを作成
  - [ ] `src/app/core/services/websocket/chat/send-q-message.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/chat/setup-chat-listeners.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/chat/remove-chat-listeners.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/chat/handle-q-response.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/chat/handle-q-stream-chunk.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/chat/handle-q-error.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/chat/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存のチャット管理メソッドを新しい関数に置き換え（62-81行、157-186行）
  - [ ] 各チャット管理関数のユニットテストを作成

- [ ] セッション管理関数の分離（1ファイル1関数）
  - [ ] `src/app/core/services/websocket/session/` ディレクトリを作成
  - [ ] `src/app/core/services/websocket/session/start-project-session.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/session/resume-session.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/session/setup-session-listeners.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/session/remove-session-listeners.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/session/handle-session-started.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/session/handle-session-status.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/session/handle-session-error.ts` ファイルを作成
  - [ ] `src/app/core/services/websocket/session/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存のセッション管理メソッドを新しい関数に置き換え（189-272行）
  - [ ] 各セッション管理関数のユニットテストを作成

- [ ] WebSocketサービスクラスの再構築
  - [ ] `src/app/core/services/websocket/websocket.service.ts` ファイルを再作成
  - [ ] 各モジュールからの関数をインポート
  - [ ] 既存の公開APIを維持（後方互換性）
  - [ ] DIトークンとプロバイダー設定を維持
  - [ ] 統合テストを作成

## Phase 3: 状態管理（AppStore）の分割と1ファイル1関数化

### TODO リスト

- [ ] 状態管理ディレクトリの再構成
  - [ ] `src/app/core/store/` ディレクトリ構造を整理
  - [ ] 既存の `app.state.ts` のバックアップ作成

- [ ] プロジェクト状態管理の分離（1ファイル1関数）
  - [ ] `src/app/core/store/project/` ディレクトリを作成
  - [ ] `src/app/core/store/project/project.state.ts` ファイルを作成（状態定義）
  - [ ] `src/app/core/store/project/actions/` ディレクトリを作成
  - [ ] `src/app/core/store/project/actions/set-active-project.ts` ファイルを作成
  - [ ] `src/app/core/store/project/actions/update-project-path.ts` ファイルを作成
  - [ ] `src/app/core/store/project/actions/clear-project.ts` ファイルを作成
  - [ ] `src/app/core/store/project/actions/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `src/app/core/store/project/selectors/` ディレクトリを作成
  - [ ] `src/app/core/store/project/selectors/get-active-project.ts` ファイルを作成
  - [ ] `src/app/core/store/project/selectors/get-project-path.ts` ファイルを作成
  - [ ] `src/app/core/store/project/selectors/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存のプロジェクト関連メソッドを移行（44-51行）
  - [ ] 各アクション・セレクターのユニットテストを作成

- [ ] セッション状態管理の分離（1ファイル1関数）
  - [ ] `src/app/core/store/session/` ディレクトリを作成
  - [ ] `src/app/core/store/session/session.state.ts` ファイルを作成（状態定義）
  - [ ] `src/app/core/store/session/actions/` ディレクトリを作成
  - [ ] `src/app/core/store/session/actions/start-session.ts` ファイルを作成
  - [ ] `src/app/core/store/session/actions/update-session-status.ts` ファイルを作成
  - [ ] `src/app/core/store/session/actions/end-session.ts` ファイルを作成
  - [ ] `src/app/core/store/session/actions/set-session-id.ts` ファイルを作成
  - [ ] `src/app/core/store/session/actions/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `src/app/core/store/session/selectors/` ディレクトリを作成
  - [ ] `src/app/core/store/session/selectors/get-session-id.ts` ファイルを作成
  - [ ] `src/app/core/store/session/selectors/get-session-status.ts` ファイルを作成
  - [ ] `src/app/core/store/session/selectors/is-session-active.ts` ファイルを作成
  - [ ] `src/app/core/store/session/selectors/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存のセッション関連メソッドを移行（53-60行）
  - [ ] 各アクション・セレクターのユニットテストを作成

- [ ] Amazon Q履歴状態管理の分離（1ファイル1関数）
  - [ ] `src/app/core/store/amazon-q-history/` ディレクトリを作成
  - [ ] `src/app/core/store/amazon-q-history/history.state.ts` ファイルを作成（状態定義）
  - [ ] `src/app/core/store/amazon-q-history/actions/` ディレクトリを作成
  - [ ] `src/app/core/store/amazon-q-history/actions/set-project-history.ts` ファイルを作成
  - [ ] `src/app/core/store/amazon-q-history/actions/set-all-projects-history.ts` ファイルを作成
  - [ ] `src/app/core/store/amazon-q-history/actions/set-conversation-details.ts` ファイルを作成
  - [ ] `src/app/core/store/amazon-q-history/actions/clear-history.ts` ファイルを作成
  - [ ] `src/app/core/store/amazon-q-history/actions/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `src/app/core/store/amazon-q-history/selectors/` ディレクトリを作成
  - [ ] `src/app/core/store/amazon-q-history/selectors/get-project-history.ts` ファイルを作成
  - [ ] `src/app/core/store/amazon-q-history/selectors/get-all-projects-history.ts` ファイルを作成
  - [ ] `src/app/core/store/amazon-q-history/selectors/get-conversation-details.ts` ファイルを作成
  - [ ] `src/app/core/store/amazon-q-history/selectors/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存の履歴関連メソッドを移行（62-74行）
  - [ ] 各アクション・セレクターのユニットテストを作成

- [ ] チャット状態管理の分離（1ファイル1関数）
  - [ ] `src/app/core/store/chat/` ディレクトリを作成
  - [ ] `src/app/core/store/chat/chat.state.ts` ファイルを作成（状態定義）
  - [ ] `src/app/core/store/chat/actions/` ディレクトリを作成
  - [ ] `src/app/core/store/chat/actions/add-message.ts` ファイルを作成
  - [ ] `src/app/core/store/chat/actions/update-message.ts` ファイルを作成
  - [ ] `src/app/core/store/chat/actions/delete-message.ts` ファイルを作成
  - [ ] `src/app/core/store/chat/actions/clear-messages.ts` ファイルを作成
  - [ ] `src/app/core/store/chat/actions/set-messages.ts` ファイルを作成
  - [ ] `src/app/core/store/chat/actions/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `src/app/core/store/chat/selectors/` ディレクトリを作成
  - [ ] `src/app/core/store/chat/selectors/get-messages.ts` ファイルを作成
  - [ ] `src/app/core/store/chat/selectors/get-message-by-id.ts` ファイルを作成
  - [ ] `src/app/core/store/chat/selectors/get-latest-message.ts` ファイルを作成
  - [ ] `src/app/core/store/chat/selectors/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存のメッセージ関連メソッドを移行（76-127行）
  - [ ] 各アクション・セレクターのユニットテストを作成

- [ ] UI状態管理の分離（1ファイル1関数）
  - [ ] `src/app/core/store/ui/` ディレクトリを作成
  - [ ] `src/app/core/store/ui/ui.state.ts` ファイルを作成（状態定義）
  - [ ] `src/app/core/store/ui/actions/` ディレクトリを作成
  - [ ] `src/app/core/store/ui/actions/set-loading.ts` ファイルを作成
  - [ ] `src/app/core/store/ui/actions/set-error.ts` ファイルを作成
  - [ ] `src/app/core/store/ui/actions/clear-error.ts` ファイルを作成
  - [ ] `src/app/core/store/ui/actions/index.ts` ファイルを作成（エクスポート集約）
  - [ ] `src/app/core/store/ui/selectors/` ディレクトリを作成
  - [ ] `src/app/core/store/ui/selectors/is-loading.ts` ファイルを作成
  - [ ] `src/app/core/store/ui/selectors/get-error.ts` ファイルを作成
  - [ ] `src/app/core/store/ui/selectors/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存のUI関連メソッドを移行（139-150行）
  - [ ] 各アクション・セレクターのユニットテストを作成

- [ ] 統合AppStoreの再構築
  - [ ] `src/app/core/store/app.store.ts` ファイルを作成
  - [ ] 各ドメインストアを統合
  - [ ] 既存のAPIを維持（後方互換性）
  - [ ] DIトークンとプロバイダー設定を維持
  - [ ] 統合テストを作成

## Phase 4: ChatComponentの分割と1ファイル1関数化

### TODO リスト

- [ ] ChatComponentディレクトリの再構成
  - [ ] `src/app/features/chat/` ディレクトリ構造を整理
  - [ ] 既存の `chat.component.ts` のバックアップ作成

- [ ] 子コンポーネントの分離
  - [ ] `src/app/features/chat/components/` ディレクトリを作成
  - [ ] `src/app/features/chat/components/chat-header/` ディレクトリを作成
  - [ ] `src/app/features/chat/components/chat-header/chat-header.component.ts` ファイルを作成
  - [ ] `src/app/features/chat/components/session-start/` ディレクトリを作成
  - [ ] `src/app/features/chat/components/session-start/session-start.component.ts` ファイルを作成
  - [ ] `src/app/features/chat/components/chat-messages/` ディレクトリを作成
  - [ ] `src/app/features/chat/components/chat-messages/chat-messages.component.ts` ファイルを作成
  - [ ] `src/app/features/chat/components/chat-error/` ディレクトリを作成
  - [ ] `src/app/features/chat/components/chat-error/chat-error.component.ts` ファイルを作成
  - [ ] `src/app/features/chat/components/empty-state/` ディレクトリを作成
  - [ ] `src/app/features/chat/components/empty-state/empty-state.component.ts` ファイルを作成
  - [ ] 既存のテンプレートを各コンポーネントに分割（192行のテンプレート）
  - [ ] 各コンポーネントのユニットテストを作成

- [ ] WebSocketリスナー管理の分離（1ファイル1関数）
  - [ ] `src/app/features/chat/services/chat-websocket/` ディレクトリを作成
  - [ ] `src/app/features/chat/services/chat-websocket/setup-listeners.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/chat-websocket/cleanup-listeners.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/chat-websocket/handle-response-listener.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/chat-websocket/handle-stream-chunk-listener.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/chat-websocket/handle-error-listener.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/chat-websocket/handle-info-listener.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/chat-websocket/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存の `setupWebSocketListeners()` を分離（426-473行）
  - [ ] 各リスナー関数のユニットテストを作成

- [ ] メッセージストリーミング処理の分離（1ファイル1関数）
  - [ ] `src/app/features/chat/services/message-streaming/` ディレクトリを作成
  - [ ] `src/app/features/chat/services/message-streaming/handle-streaming-response.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/message-streaming/handle-streaming-chunk.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/message-streaming/finalize-streaming.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/message-streaming/create-streaming-message.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/message-streaming/update-streaming-message.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/message-streaming/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存のストリーミング処理ロジックを分離（476-513行）
  - [ ] 各ストリーミング関数のユニットテストを作成

- [ ] セッション管理の分離（1ファイル1関数）
  - [ ] `src/app/features/chat/services/session-manager/` ディレクトリを作成
  - [ ] `src/app/features/chat/services/session-manager/resume-session.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/session-manager/handle-session-timeout.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/session-manager/check-session-status.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/session-manager/format-info-message.ts` ファイルを作成
  - [ ] `src/app/features/chat/services/session-manager/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 既存の `resumeSession()` を分離（379-423行）
  - [ ] 各セッション管理関数のユニットテストを作成

- [ ] ユーティリティの分離（1ファイル1関数）
  - [ ] `src/app/features/chat/utils/` ディレクトリを作成
  - [ ] `src/app/features/chat/utils/message-index-manager.ts` ファイルを作成
  - [ ] `src/app/features/chat/utils/session-status-checker.ts` ファイルを作成
  - [ ] `src/app/features/chat/utils/scroll-to-active-chat.ts` ファイルを作成
  - [ ] `src/app/features/chat/utils/index.ts` ファイルを作成（エクスポート集約）
  - [ ] メッセージインデックス管理ロジックを移動
  - [ ] 各ユーティリティ関数のユニットテストを作成

- [ ] ChatComponentの再構築
  - [ ] `src/app/features/chat/chat.component.ts` ファイルを再作成
  - [ ] 各モジュールからの関数・コンポーネントをインポート
  - [ ] シンプルなコンテナーコンポーネントとして再実装
  - [ ] 統合テストを作成

## Phase 5: その他のコンポーネントリファクタリング

### TODO リスト

- [ ] MessageListComponentの分割（1ファイル1関数）
  - [ ] `src/app/shared/components/message-list/services/` ディレクトリを作成
  - [ ] `src/app/shared/components/message-list/services/message-manager/` ディレクトリを作成
  - [ ] `src/app/shared/components/message-list/services/message-manager/add-message.ts` ファイルを作成
  - [ ] `src/app/shared/components/message-list/services/message-manager/delete-message.ts` ファイルを作成
  - [ ] `src/app/shared/components/message-list/services/message-manager/update-messages.ts` ファイルを作成
  - [ ] `src/app/shared/components/message-list/services/message-manager/index.ts` ファイルを作成
  - [ ] `src/app/shared/components/message-list/services/scroll-manager/` ディレクトリを作成
  - [ ] `src/app/shared/components/message-list/services/scroll-manager/scroll-to-bottom.ts` ファイルを作成
  - [ ] `src/app/shared/components/message-list/services/scroll-manager/index.ts` ファイルを作成
  - [ ] `src/app/shared/components/message-list/utils/` ディレクトリを作成
  - [ ] `src/app/shared/components/message-list/utils/message-converter.ts` ファイルを作成
  - [ ] `src/app/shared/components/message-list/utils/welcome-message-generator.ts` ファイルを作成
  - [ ] `src/app/shared/components/message-list/utils/index.ts` ファイルを作成
  - [ ] 既存のメソッドを新しい関数に置き換え
  - [ ] 各関数のユニットテストを作成

- [ ] PathSelectorComponentの分割（1ファイル1関数）
  - [ ] `src/app/shared/components/path-selector/services/` ディレクトリを作成
  - [ ] `src/app/shared/components/path-selector/services/path-validator/` ディレクトリを作成
  - [ ] `src/app/shared/components/path-selector/services/path-validator/validate-path.ts` ファイルを作成
  - [ ] `src/app/shared/components/path-selector/services/path-validator/index.ts` ファイルを作成
  - [ ] `src/app/shared/components/path-selector/services/session-starter/` ディレクトリを作成
  - [ ] `src/app/shared/components/path-selector/services/session-starter/start-project.ts` ファイルを作成
  - [ ] `src/app/shared/components/path-selector/services/session-starter/index.ts` ファイルを作成
  - [ ] `src/app/shared/components/path-selector/utils/` ディレクトリを作成
  - [ ] `src/app/shared/components/path-selector/utils/path-formatter.ts` ファイルを作成
  - [ ] `src/app/shared/components/path-selector/utils/index.ts` ファイルを作成
  - [ ] 既存のメソッドを新しい関数に置き換え
  - [ ] 各関数のユニットテストを作成

- [ ] MessageInputComponentの改善（1ファイル1関数）
  - [ ] `src/app/shared/components/message-input/services/` ディレクトリを作成
  - [ ] `src/app/shared/components/message-input/services/message-sender/` ディレクトリを作成
  - [ ] `src/app/shared/components/message-input/services/message-sender/send-message.ts` ファイルを作成
  - [ ] `src/app/shared/components/message-input/services/message-sender/index.ts` ファイルを作成
  - [ ] `src/app/shared/components/message-input/utils/` ディレクトリを作成
  - [ ] `src/app/shared/components/message-input/utils/composition-state-manager.ts` ファイルを作成
  - [ ] `src/app/shared/components/message-input/utils/index.ts` ファイルを作成
  - [ ] 既存のメソッドを新しい関数に置き換え
  - [ ] 各関数のユニットテストを作成

- [ ] AmazonQMessageComponentの改善
  - [ ] メッセージ表示ロジックの分離
  - [ ] フォーマット処理の抽出
  - [ ] ユニットテストの作成

- [ ] SidebarComponentの改善
  - [ ] プロジェクトリスト管理の分離
  - [ ] ナビゲーション処理の抽出
  - [ ] ユニットテストの作成

- [ ] NavigationComponentの改善
  - [ ] ルーティングロジックの分離
  - [ ] 状態管理の整理
  - [ ] ユニットテストの作成

## Phase 6: 型定義とインターフェースの整理

### TODO リスト

- [ ] 型定義ディレクトリの作成
  - [ ] `src/app/core/types/` ディレクトリを作成
  - [ ] `src/app/shared/types/` ディレクトリを作成

- [ ] 共通型定義の作成
  - [ ] `src/app/core/types/common.types.ts` ファイルを作成
  - [ ] `MessageId` 型を定義
  - [ ] `SessionId` 型を定義
  - [ ] `Timestamp` 型を定義
  - [ ] `ErrorCode` 型を定義
  - [ ] 型ガード関数を追加

- [ ] WebSocket型定義の整理
  - [ ] `src/app/core/types/websocket.types.ts` ファイルを作成
  - [ ] WebSocketイベント型を定義
  - [ ] WebSocketメッセージ型を定義
  - [ ] WebSocket接続状態型を定義

- [ ] Amazon Q型定義の整理
  - [ ] `src/app/core/types/amazon-q.types.ts` ファイルを作成
  - [ ] Amazon Qメッセージ型を定義
  - [ ] Amazon Q履歴型を定義
  - [ ] Amazon Qセッション型を定義

- [ ] UI型定義の整理
  - [ ] `src/app/shared/types/ui.types.ts` ファイルを作成
  - [ ] UIコンポーネント用の型を定義
  - [ ] フォーム型を定義
  - [ ] 表示用メッセージ型を定義

- [ ] 既存型定義の移行
  - [ ] 各コンポーネント・サービスの型定義を整理
  - [ ] 重複する型定義を統合
  - [ ] 型定義のエクスポート構造を最適化

## Phase 7: テストとドキュメントの更新

### TODO リスト

- [ ] テスト環境の整備
  - [ ] Jest設定の更新（新しいディレクトリ構造対応）
  - [ ] テストヘルパー関数の作成
  - [ ] モックファクトリーの作成

- [ ] 単体テストの作成・更新
  - [ ] 全ユーティリティ関数の単体テスト作成
  - [ ] 全サービス関数の単体テスト作成
  - [ ] 全コンポーネントの単体テスト作成
  - [ ] 全ストアアクション・セレクターの単体テスト作成

- [ ] 統合テストの作成
  - [ ] WebSocketサービス統合テスト作成
  - [ ] 状態管理統合テスト作成
  - [ ] ChatComponent統合テスト作成
  - [ ] コンポーネント間連携テスト作成

- [ ] E2Eテストの更新
  - [ ] 既存のE2Eテストを新しい構造に対応
  - [ ] 新機能のE2Eテスト追加
  - [ ] パフォーマンステスト追加

- [ ] ドキュメントの更新
  - [ ] アーキテクチャ図の作成
    - [ ] フロントエンド全体構成図（Mermaid形式）
    - [ ] コンポーネント階層図
    - [ ] データフロー図
    - [ ] 状態管理フロー図
  - [ ] APIドキュメントの更新
    - [ ] WebSocketイベント仕様書
    - [ ] ストアAPI仕様書
    - [ ] サービスAPI仕様書
  - [ ] 開発者ガイドの作成
    - [ ] フロントエンド開発ガイド
    - [ ] コンポーネント作成ガイド
    - [ ] 状態管理ガイド
    - [ ] テスト作成ガイド

- [ ] CLAUDE.mdの更新
  - [ ] フロントエンドアーキテクチャ説明追加
  - [ ] 新しいディレクトリ構造説明追加
  - [ ] 開発コマンド更新
  - [ ] Angular最新バージョン対応確認

## 全フェーズ共通のTODO

- [ ] 各フェーズ完了後のコードレビュー
- [ ] TypeScript strictモードでのビルド確認
- [ ] ESLintエラーの解消
- [ ] Prettierフォーマットの適用
- [ ] パフォーマンス測定と最適化
  - [ ] 初期ロード時間の測定
  - [ ] メモリ使用量の測定
  - [ ] レンダリングパフォーマンスの測定
- [ ] バンドルサイズの最適化
  - [ ] 不要な依存関係の削除
  - [ ] Tree-shakingの確認
  - [ ] Lazy loadingの最適化

---

*最終更新日: 2025-07-18*