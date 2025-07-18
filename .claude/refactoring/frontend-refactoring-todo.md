# フロントエンドリファクタリング実装計画書

**こちらは実装ごとにチェックボックスをつけて進捗がわかるようにすること**

## Phase 1: 共通ユーティリティの抽出と1ファイル1関数化

### TODO リスト

- [x] バリデーターユーティリティの作成（1ファイル1関数）
  - [x] `src/app/shared/utils/validators/` ディレクトリを作成
  - [x] `src/app/shared/utils/validators/path-validator.ts` ファイルを作成
  - [x] `src/app/shared/utils/validators/message-validator.ts` ファイルを作成
  - [x] `src/app/shared/utils/validators/session-validator.ts` ファイルを作成
  - [x] `src/app/shared/utils/validators/index.ts` ファイルを作成（エクスポート集約）
  - [x] `path-selector.component.ts` の `validatePath()` ロジックを移動（91-108行）
  - [x] 各バリデーター関数のユニットテストを作成

- [x] フォーマッターユーティリティの作成（1ファイル1関数）
  - [x] `src/app/shared/utils/formatters/` ディレクトリを作成
  - [x] `src/app/shared/utils/formatters/message-formatter.ts` ファイルを作成
  - [x] `src/app/shared/utils/formatters/date-formatter.ts` ファイルを作成
  - [x] `src/app/shared/utils/formatters/path-formatter.ts` ファイルを作成
  - [x] `src/app/shared/utils/formatters/info-message-formatter.ts` ファイルを作成
  - [x] `src/app/shared/utils/formatters/index.ts` ファイルを作成（エクスポート集約）
  - [x] 各フォーマッター関数のユニットテストを作成

- [x] コンバーターユーティリティの作成（1ファイル1関数）
  - [x] `src/app/shared/utils/converters/` ディレクトリを作成
  - [x] `src/app/shared/utils/converters/display-message-converter.ts` ファイルを作成
  - [x] `src/app/shared/utils/converters/chat-message-converter.ts` ファイルを作成
  - [x] `src/app/shared/utils/converters/index.ts` ファイルを作成（エクスポート集約）
  - [x] `message-list.component.ts` の `convertDisplayMessagesToChatMessages()` を移動（210-222行）
  - [x] 各コンバーター関数のユニットテストを作成

- [x] ジェネレーターユーティリティの作成（1ファイル1関数）
  - [x] `src/app/shared/utils/generators/` ディレクトリを作成
  - [x] `src/app/shared/utils/generators/id-generator.ts` ファイルを作成
  - [x] `src/app/shared/utils/generators/timestamp-generator.ts` ファイルを作成
  - [x] `src/app/shared/utils/generators/welcome-message-generator.ts` ファイルを作成
  - [x] `src/app/shared/utils/generators/index.ts` ファイルを作成（エクスポート集約）
  - [x] `message-list.component.ts` の `getWelcomeMessage()` を移動（225-235行）
  - [x] 各ジェネレーター関数のユニットテストを作成

## Phase 2: WebSocketサービスの分割と1ファイル1関数化

### TODO リスト

- [x] WebSocketサービスディレクトリの作成
  - [x] `src/app/core/services/websocket/` ディレクトリを作成
  - [x] 既存の `websocket.service.ts` のバックアップ作成

- [x] 接続管理関数の分離（1ファイル1関数）
  - [x] `src/app/core/services/websocket/connection/` ディレクトリを作成
  - [x] `src/app/core/services/websocket/connection/connect.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/connection/disconnect.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/connection/emit.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/connection/on.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/connection/off.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/connection/connection-state.ts` ファイルを作成（signal管理）
  - [x] `src/app/core/services/websocket/connection/index.ts` ファイルを作成（エクスポート集約）
  - [x] 既存の接続管理メソッドを新しい関数に置き換え（29-59行）
  - [x] 各接続管理関数のユニットテストを作成

- [x] Amazon Q履歴管理関数の分離（1ファイル1関数）
  - [x] `src/app/core/services/websocket/amazon-q-history/` ディレクトリを作成
  - [x] `src/app/core/services/websocket/amazon-q-history/get-project-history.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/amazon-q-history/get-all-projects-history.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/amazon-q-history/get-project-history-detailed.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/amazon-q-history/setup-history-listeners.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/amazon-q-history/remove-history-listeners.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/amazon-q-history/index.ts` ファイルを作成（エクスポート集約）
  - [x] 既存の履歴管理メソッドを新しい関数に置き換え（84-154行）
  - [x] 各履歴管理関数のユニットテストを作成

- [x] チャット管理関数の分離（1ファイル1関数）
  - [x] `src/app/core/services/websocket/chat/` ディレクトリを作成
  - [x] `src/app/core/services/websocket/chat/send-q-message.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/chat/setup-chat-listeners.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/chat/remove-chat-listeners.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/chat/abort-session.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/chat/index.ts` ファイルを作成（エクスポート集約）
  - [x] 既存のチャット管理メソッドを新しい関数に置き換え（62-81行、157-186行）
  - [x] 各チャット管理関数のユニットテストを作成

- [x] プロジェクトセッション管理関数の分離（1ファイル1関数）
  - [x] `src/app/core/services/websocket/project-session/` ディレクトリを作成
  - [x] `src/app/core/services/websocket/project-session/start-project-session.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/project-session/resume-session.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/project-session/setup-project-session-listeners.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/project-session/remove-project-session-listeners.ts` ファイルを作成
  - [x] `src/app/core/services/websocket/project-session/index.ts` ファイルを作成（エクスポート集約）
  - [x] 既存のセッション管理メソッドを新しい関数に置き換え（189-272行）

- [x] WebSocketサービスクラスの再構築
  - [x] `src/app/core/services/websocket/websocket.service.ts` ファイルを再作成
  - [x] 各モジュールからの関数をインポート
  - [x] 既存の公開APIを維持（後方互換性）
  - [x] DIトークンとプロバイダー設定を維持
  - [x] 型定義の統一（types.ts）
  - [x] 統合テストを作成

## Phase 3: 状態管理（AppStore）の分割と1ファイル1関数化

### TODO リスト

- [x] 状態管理ディレクトリの再構成
  - [x] `src/app/core/store/` ディレクトリ構造を整理
  - [x] 既存の `app.state.ts` のバックアップ作成

- [x] プロジェクト状態管理の分離（1ファイル1関数）
  - [x] `src/app/core/store/project/` ディレクトリを作成
  - [x] `src/app/core/store/project/project.state.ts` ファイルを作成（状態定義）
  - [x] `src/app/core/store/project/actions/` ディレクトリを作成
  - [x] `src/app/core/store/project/actions/set-projects.ts` ファイルを作成
  - [x] `src/app/core/store/project/actions/set-current-project.ts` ファイルを作成
  - [x] `src/app/core/store/project/actions/add-project.ts` ファイルを作成
  - [x] `src/app/core/store/project/actions/update-project.ts` ファイルを作成
  - [x] `src/app/core/store/project/actions/remove-project.ts` ファイルを作成
  - [x] `src/app/core/store/project/actions/set-project-loading.ts` ファイルを作成
  - [x] `src/app/core/store/project/actions/set-project-error.ts` ファイルを作成
  - [x] `src/app/core/store/project/actions/index.ts` ファイルを作成（エクスポート集約）
  - [x] `src/app/core/store/project/selectors/` ディレクトリを作成
  - [x] `src/app/core/store/project/selectors/get-projects.ts` ファイルを作成
  - [x] `src/app/core/store/project/selectors/get-current-project.ts` ファイルを作成
  - [x] `src/app/core/store/project/selectors/has-projects.ts` ファイルを作成
  - [x] `src/app/core/store/project/selectors/is-project-selected.ts` ファイルを作成
  - [x] `src/app/core/store/project/selectors/index.ts` ファイルを作成（エクスポート集約）

- [x] セッション状態管理の分離（1ファイル1関数）
  - [x] `src/app/core/store/session/` ディレクトリを作成
  - [x] `src/app/core/store/session/session.state.ts` ファイルを作成（状態定義）
  - [x] `src/app/core/store/session/actions/` ディレクトリを作成
  - [x] `src/app/core/store/session/actions/set-sessions.ts` ファイルを作成
  - [x] `src/app/core/store/session/actions/set-current-session.ts` ファイルを作成
  - [x] `src/app/core/store/session/actions/set-current-q-session.ts` ファイルを作成
  - [x] `src/app/core/store/session/actions/add-session.ts` ファイルを作成
  - [x] `src/app/core/store/session/actions/set-session-starting.ts` ファイルを作成
  - [x] `src/app/core/store/session/actions/set-session-error.ts` ファイルを作成
  - [x] `src/app/core/store/session/actions/switch-to-active-session.ts` ファイルを作成
  - [x] `src/app/core/store/session/actions/clear-current-session.ts` ファイルを作成
  - [x] `src/app/core/store/session/actions/index.ts` ファイルを作成（エクスポート集約）
  - [x] `src/app/core/store/session/selectors/` ディレクトリを作成
  - [x] `src/app/core/store/session/selectors/get-sessions.ts` ファイルを作成
  - [x] `src/app/core/store/session/selectors/get-current-session.ts` ファイルを作成
  - [x] `src/app/core/store/session/selectors/get-current-q-session.ts` ファイルを作成
  - [x] `src/app/core/store/session/selectors/is-session-active.ts` ファイルを作成
  - [x] `src/app/core/store/session/selectors/get-session-starting.ts` ファイルを作成
  - [x] `src/app/core/store/session/selectors/get-session-error.ts` ファイルを作成
  - [x] `src/app/core/store/session/selectors/index.ts` ファイルを作成（エクスポート集約）

- [x] Amazon Q履歴状態管理の分離（1ファイル1関数）
  - [x] `src/app/core/store/amazon-q-history/` ディレクトリを作成
  - [x] `src/app/core/store/amazon-q-history/amazon-q-history.state.ts` ファイルを作成（状態定義）
  - [x] `src/app/core/store/amazon-q-history/actions/` ディレクトリを作成
  - [x] `src/app/core/store/amazon-q-history/actions/set-amazon-q-history.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/actions/set-current-q-conversation.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/actions/set-detailed-history-messages.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/actions/set-history-stats.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/actions/set-q-history-loading.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/actions/switch-to-history-view.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/actions/switch-to-detailed-history-view.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/actions/add-q-history-item.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/actions/index.ts` ファイルを作成（エクスポート集約）
  - [x] `src/app/core/store/amazon-q-history/selectors/` ディレクトリを作成
  - [x] `src/app/core/store/amazon-q-history/selectors/get-amazon-q-history.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/selectors/get-current-q-conversation.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/selectors/get-detailed-history-messages.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/selectors/get-history-stats.ts` ファイルを作成
  - [x] `src/app/core/store/amazon-q-history/selectors/index.ts` ファイルを作成（エクスポート集約）

- [x] チャット状態管理の分離（1ファイル1関数）
  - [x] `src/app/core/store/chat/` ディレクトリを作成
  - [x] `src/app/core/store/chat/chat.state.ts` ファイルを作成（状態定義）
  - [x] `src/app/core/store/chat/actions/` ディレクトリを作成
  - [x] `src/app/core/store/chat/actions/add-chat-message.ts` ファイルを作成
  - [x] `src/app/core/store/chat/actions/update-chat-message.ts` ファイルを作成
  - [x] `src/app/core/store/chat/actions/remove-chat-message.ts` ファイルを作成
  - [x] `src/app/core/store/chat/actions/set-chat-messages.ts` ファイルを作成
  - [x] `src/app/core/store/chat/actions/clear-chat-messages.ts` ファイルを作成
  - [x] `src/app/core/store/chat/actions/index.ts` ファイルを作成（エクスポート集約）
  - [x] `src/app/core/store/chat/selectors/` ディレクトリを作成
  - [x] `src/app/core/store/chat/selectors/get-chat-messages.ts` ファイルを作成
  - [x] `src/app/core/store/chat/selectors/get-session-messages.ts` ファイルを作成
  - [x] `src/app/core/store/chat/selectors/has-chat-messages.ts` ファイルを作成
  - [x] `src/app/core/store/chat/selectors/index.ts` ファイルを作成（エクスポート集約）

- [x] 統合状態管理の作成（1ファイル1関数）
  - [x] `src/app/core/store/app.state.ts` ファイルを新しいモジュラー構造で再作成
  - [x] 各分離されたストアを統合する包括的なストア作成
  - [x] 従来のAppStoreと互換性のあるインターフェース提供
  - [x] 既存コンポーネントでの使用を新しいストアに移行

- [x] UI状態管理の分離（1ファイル1関数）
  - [x] UI状態管理を統合状態管理に含める形で実装
  - [x] loading、error状態の管理機能を提供

- [x] 統合AppStoreの再構築
  - [x] `src/app/core/store/app.state.ts` ファイルを作成
  - [x] 各ドメインストアを統合
  - [x] 既存のAPIを維持（後方互換性）
  - [x] DIトークンとプロバイダー設定を維持
  - [x] 統合テストを作成

## Phase 4: ChatComponentの分割と1ファイル1関数化

### TODO リスト

- [x] ChatComponentディレクトリの再構成
  - [x] `src/app/features/chat/` ディレクトリ構造を整理
  - [x] 既存の `chat.component.ts` のバックアップ作成

- [x] 子コンポーネントの分離
  - [x] `src/app/features/chat/components/` ディレクトリを作成
  - [x] `src/app/features/chat/components/chat-header/` ディレクトリを作成
  - [x] `src/app/features/chat/components/chat-header/chat-header.component.ts` ファイルを作成
  - [x] `src/app/features/chat/components/session-start/` ディレクトリを作成
  - [x] `src/app/features/chat/components/session-start/session-start.component.ts` ファイルを作成
  - [x] `src/app/features/chat/components/chat-messages/` ディレクトリを作成
  - [x] `src/app/features/chat/components/chat-messages/chat-messages.component.ts` ファイルを作成
  - [x] `src/app/features/chat/components/chat-error/` ディレクトリを作成
  - [x] `src/app/features/chat/components/chat-error/chat-error.component.ts` ファイルを作成
  - [x] `src/app/features/chat/components/empty-state/` ディレクトリを作成
  - [x] `src/app/features/chat/components/empty-state/empty-state.component.ts` ファイルを作成
  - [x] 既存のテンプレートを各コンポーネントに分割（192行のテンプレート）
  - [ ] 各コンポーネントのユニットテストを作成

- [x] WebSocketリスナー管理の分離（1ファイル1関数）
  - [x] `src/app/features/chat/services/chat-websocket/` ディレクトリを作成
  - [x] `src/app/features/chat/services/chat-websocket/setup-listeners.ts` ファイルを作成
  - [x] `src/app/features/chat/services/chat-websocket/cleanup-listeners.ts` ファイルを作成
  - [x] `src/app/features/chat/services/chat-websocket/handle-streaming-response.ts` ファイルを作成
  - [x] `src/app/features/chat/services/chat-websocket/handle-error-response.ts` ファイルを作成
  - [x] `src/app/features/chat/services/chat-websocket/handle-info-response.ts` ファイルを作成
  - [x] `src/app/features/chat/services/chat-websocket/handle-completion-response.ts` ファイルを作成
  - [x] `src/app/features/chat/services/chat-websocket/index.ts` ファイルを作成（エクスポート集約）
  - [x] 既存の `setupWebSocketListeners()` を分離（426-473行）
  - [ ] 各リスナー関数のユニットテストを作成

- [x] メッセージストリーミング処理の分離（1ファイル1関数）
  - [x] `src/app/features/chat/services/message-streaming/` ディレクトリを作成
  - [x] `src/app/features/chat/services/message-streaming/handle-streaming-start.ts` ファイルを作成
  - [x] `src/app/features/chat/services/message-streaming/handle-streaming-update.ts` ファイルを作成
  - [x] `src/app/features/chat/services/message-streaming/format-info-message.ts` ファイルを作成
  - [x] `src/app/features/chat/services/message-streaming/should-display-error.ts` ファイルを作成
  - [x] `src/app/features/chat/services/message-streaming/index.ts` ファイルを作成（エクスポート集約）
  - [x] 既存のストリーミング処理ロジックを分離（476-513行）
  - [ ] 各ストリーミング関数のユニットテストを作成

- [x] セッション管理の分離（1ファイル1関数）
  - [x] `src/app/features/chat/services/session-manager/` ディレクトリを作成
  - [x] `src/app/features/chat/services/session-manager/resume-session.ts` ファイルを作成
  - [x] `src/app/features/chat/services/session-manager/index.ts` ファイルを作成（エクスポート集約）
  - [x] 既存の `resumeSession()` を分離（379-423行）
  - [ ] 各セッション管理関数のユニットテストを作成

- [x] ユーティリティの分離（1ファイル1関数）
  - [x] `src/app/features/chat/utils/` ディレクトリを作成
  - [x] `src/app/features/chat/utils/message-index-manager.ts` ファイルを作成
  - [x] `src/app/features/chat/utils/session-status-checker.ts` ファイルを作成
  - [x] `src/app/features/chat/utils/project-path-utils.ts` ファイルを作成
  - [x] `src/app/features/chat/utils/index.ts` ファイルを作成（エクスポート集約）
  - [x] メッセージインデックス管理ロジックを移動
  - [ ] 各ユーティリティ関数のユニットテストを作成

- [x] ChatComponentの再構築
  - [x] `src/app/features/chat/chat.component.ts` ファイルを再作成
  - [x] 各モジュールからの関数・コンポーネントをインポート
  - [x] シンプルなコンテナーコンポーネントとして再実装
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