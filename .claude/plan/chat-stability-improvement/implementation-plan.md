# Amazon Q CLI チャット安定化実装計画

## 📋 プロジェクト概要

Amazon Q CLIとのチャット動作を安定化させるための改善実装計画。
主要課題：送信ボタン制御、ツール表示最適化、履歴表示最適化

## 🔍 現状分析結果

### Issue#33からの知見
- SQLiteデータベース: `~/Library/Application Support/amazon-q/data.sqlite3`
- conversations テーブル構造: key (TEXT PRIMARY KEY), value (TEXT)
- 履歴データはJSON形式で保存

### Amazon Q CLI動作パターンの発見
- **Thinking状態**: `⠋ Thinking...` スピナー表示
- **入力待ち状態**: `>` プロンプト表示（重要な検出ポイント）
- **レスポンス中**: テキストストリーミング
- **アイドル状態**: プロンプト待機

### 現在の実装課題
1. **状態管理の分散**: セッション、Thinking、ストリーミング状態が個別管理
2. **送信ボタン制御**: 単純なboolean状態で管理、他状態との連動不足
3. **WebSocketイベントタイミング**: 複数状態の非同期更新による競合

## 🎯 実装目標

### 1. 送信ボタンの確実な制御
- Amazon Q CLIの`>`プロンプト検出による自動制御
- Thinking中、レスポンス中の送信禁止
- エラー時の適切な状態復旧

### 2. ツール表示の最適化
- リアルタイムツール検出の精度向上
- ツール情報の視覚的改善

### 3. 履歴表示の最適化
- SQLiteデータベース連携の改善
- 履歴読み込み性能の向上

## 📝 TODO実装リスト

### Phase 1: プロンプト検出システム構築
- [ ] **T1-001** バックエンド：`>`プロンプト検出ロジック実装
  - ファイル: `apps/backend/src/services/amazon-q-cli/message-handler/detect-prompt-ready.ts`
  - 機能: stdout出力から`>`プロンプト検出
  - テスト: 検出精度とタイミングの検証

- [ ] **T1-002** バックエンド：プロンプト状態をWebSocket経由でフロントエンドに通知
  - ファイル: `apps/backend/src/services/websocket/amazon-q-handler/emit-prompt-ready.ts`
  - 機能: `prompt-ready`イベントの配信
  - 連携: handle-stdout.tsとの統合

- [ ] **T1-003** フロントエンド：プロンプト状態リスナー実装
  - ファイル: `apps/frontend/src/app/core/services/websocket/chat/handle-prompt-ready.ts`
  - 機能: プロンプト準備完了イベントの受信処理

### Phase 2: 統合チャット状態管理
- [ ] **T2-001** フロントエンド：統合チャット状態signalの作成
  - ファイル: `apps/frontend/src/app/core/store/chat/chat-state-manager.ts`
  - 機能: idle, thinking, responding, prompt-ready状態の統一管理
  - 既存: chat.state.tsの拡張

- [ ] **T2-002** フロントエンド：送信ボタン制御ロジックの改善
  - ファイル: `apps/frontend/src/app/shared/components/message-input/services/send-control/`
  - 機能: 統合状態を基にした送信可否判定
  - 更新: message-input.component.tsのcanSend()改善

- [ ] **T2-003** フロントエンド：状態変更時のUI更新最適化
  - ファイル: `apps/frontend/src/app/features/chat/services/chat-websocket/handle-state-change.ts`
  - 機能: 状態変更イベントに対するUI同期処理

### Phase 3: ツール表示最適化
- [ ] **T3-001** バックエンド：ツール検出バッファの改善
  - ファイル: `apps/backend/src/services/amazon-q-message-parser/tool-detection-buffer.ts`
  - 機能: 分割ツールパターンの検出精度向上
  - テスト: 既存テストケースの拡張

- [ ] **T3-002** フロントエンド：ツール表示コンポーネントの最適化
  - ファイル: `apps/frontend/src/app/shared/components/amazon-q-message/utils/format-tools-display.ts`
  - 機能: ツール情報の視覚的改善とパフォーマンス向上

- [ ] **T3-003** リアルタイムツール更新の実装
  - ファイル: `apps/frontend/src/app/features/chat/services/message-streaming/handle-tool-update.ts`
  - 機能: ストリーミング中のツール情報リアルタイム更新

### Phase 4: 履歴表示最適化
- [ ] **T4-001** バックエンド：SQLite履歴読み込み性能改善
  - ファイル: `apps/backend/src/services/amazon-q-history/get-project-history-optimized.ts`
  - 機能: インデックス活用とクエリ最適化
  - 対象: get-project-history.ts の改良版

- [ ] **T4-002** フロントエンド：履歴表示コンポーネントの仮想化
  - ファイル: `apps/frontend/src/app/features/chat/components/chat-messages/virtual-scroll.ts`
  - 機能: 大量履歴データの効率表示

- [ ] **T4-003** 履歴データの段階的読み込み実装
  - ファイル: `apps/frontend/src/app/core/services/websocket/amazon-q-history/lazy-load-history.ts`
  - 機能: ページネーション機能

### Phase 5: エラーハンドリングと安定性向上
- [ ] **T5-001** バックエンド：プロセス異常終了時の自動復旧
  - ファイル: `apps/backend/src/services/amazon-q-cli/process-manager/auto-recovery.ts`
  - 機能: プロセス監視と自動再起動

- [ ] **T5-002** フロントエンド：ネットワーク切断時の自動再接続
  - ファイル: `apps/frontend/src/app/core/services/websocket/connection/auto-reconnect.ts`
  - 機能: WebSocket接続の自動復旧

- [ ] **T5-003** 状態同期エラーの自動修正
  - ファイル: `apps/frontend/src/app/core/store/chat/sync-recovery.ts`
  - 機能: フロントエンド・バックエンド状態の自動同期修復

### Phase 6: テストとドキュメント
- [ ] **T6-001** 統合テストの追加
  - ディレクトリ: `apps/backend/src/tests/integration/chat-stability/`
  - 内容: プロンプト検出、状態管理、エラー復旧の統合テスト

- [ ] **T6-002** E2Eテストの実装
  - ディレクトリ: `apps/frontend/src/tests/e2e/chat-stability/`
  - 内容: ユーザージャーニー全体のテスト

- [ ] **T6-003** パフォーマンステスト
  - ファイル: `performance-tests/chat-stability-load-test.ts`
  - 内容: 高負荷時の安定性検証

## 🏗️ 技術実装詳細

### プロンプト検出アルゴリズム
```typescript
// 擬似コード：プロンプト検出ロジック
function detectPromptReady(outputLine: string): boolean {
  const trimmed = outputLine.trim();
  // `>`が単独で表示されるケースを検出
  return /^>\s*$/.test(trimmed) && 
         !isInThinkingState() && 
         !isToolExecuting();
}
```

### 統合状態管理
```typescript
// チャット状態の型定義
type ChatStatus = 'idle' | 'thinking' | 'responding' | 'prompt-ready' | 'error';

// 統合状態signal
const chatState = signal<{
  status: ChatStatus;
  canSend: boolean;
  streamingMessageId?: string;
  currentTools?: string[];
}>({
  status: 'idle',
  canSend: true
});
```

## 📊 成功指標

### 品質指標
- プロンプト検出精度の向上
- 状態同期エラーの削減
- ユーザビリティ改善: 送信ボタンの誤動作防止

## 🔄 実装フロー

1. **Phase 1**: プロンプト検出基盤
2. **Phase 2**: 状態管理統合
3. **Phase 3**: ツール表示最適化
4. **Phase 4**: 履歴最適化
5. **Phase 5**: エラー対策
6. **Phase 6**: テスト・検証

各フェーズ完了後にテストを実行し、品質を確認してから次フェーズに進行。

## 📝 注意事項

- 既存のテスト（182+ backend, 292 frontend）を破綻させない
- 1-file-1-function アーキテクチャを維持
- TypeScript型安全性を保持
- TDD（テスト駆動開発）アプローチを採用

