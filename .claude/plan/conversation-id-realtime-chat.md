# conversation_idベースリアルタイムチャット監視システム実装計画

## 概要

Amazon Q CLIのSQLite3データベースに保存されるconversation_idを活用したリアルタイムチャットレスポンス取得機能を実装します。現在の「Hello! I'm Amazon Q...」以外のレスポンスが表示されない問題を解決し、conversation_id単位でのURL管理も実現します。

## 技術調査結果

### Amazon Q CLI SQLite3動作パターン
- **データベースパス**: `~/Library/Application Support/amazon-q/data.sqlite3`
- **テーブル構造**: `conversations(key TEXT, value TEXT)` - keyはプロジェクトパス、valueはJSON
- **conversation_id**: UUID形式で一意識別（例：`fb5cdbe5-934c-4e25-9abd-bcc28617ba5b`）
- **データ更新**: メッセージ送信時にtranscript配列が即座に更新
- **resume動作**: `--resume`フラグ使用時のみconversation_idが維持される

### 重要な発見
- ✅ conversation_idは固定UUIDで管理される
- ✅ transcript配列に表示用メッセージが格納される
- ✅ 既存のSQLite3変更検知システムが活用可能
- ⚠️ 通常のq chat実行時は毎回新しいconversation_idが生成される

## 実装タスク

### Phase 1: Backend - conversation_id管理機能 🔥 **優先度：最高**

#### 1.1 conversation_id追跡システム
- [ ] `track-active-conversation.ts`: 新規conversation_id検知機能
  - プロジェクトパス単位での新規conversation挿入検知
  - conversation_idの即座抽出と保存
  - セッション-conversation_idマッピング管理
- [ ] `get-conversation-by-project-path.ts`: プロジェクトパス指定でのconversation取得
- [ ] `extract-conversation-id-from-sqlite.ts`: SQLite3からconversation_idを効率的に抽出

#### 1.2 セッション統合
- [ ] `session-manager/update-conversation-id.ts`: セッションにconversation_id追加
- [ ] `QProcessSession`型定義の拡張（conversation_idフィールド追加）
- [ ] セッション開始時のconversation_id自動取得ロジック

### Phase 2: Backend - transcript監視システム 🔥 **優先度：最高**

#### 2.1 リアルタイム監視機能
- [ ] `monitor-conversation-transcript.ts`: transcript配列変更監視
  - 前回の配列長との比較によるメッセージ検出
  - 新規メッセージの抽出とパース
  - ツール情報の解析（`[Tool uses: tool_name]`）
- [ ] `database-change-handler-with-transcript.ts`: transcript特化型変更ハンドラー
- [ ] `conversation-transcript-cache.ts`: メモリキャッシュによる効率化

#### 2.2 WebSocketイベント拡張
- [ ] `handle-conversation-transcript-update.ts`: transcript更新通知ハンドラー
- [ ] WebSocketイベント型定義の追加
  - `conversation:ready` - conversation_id確定通知
  - `conversation:transcript-update` - 新規メッセージ通知
  - `conversation:tool-activity` - ツール使用通知

### Phase 3: Frontend - UI/UX改善とナビゲーション 🎯 **優先度：高**

#### 3.1 既存New Project画面の拡張
- [ ] `/chat`画面（既存のproject path入力画面）の改善
- [ ] プロジェクトパス入力 → pi-arrow-rightボタンの実装
- [ ] ローディング状態管理（ボタン → スピナー表示）
- [ ] conversation_id取得完了時の自動遷移

#### 3.2 ルーティング実装
- [ ] `/chat/:conversation_id`ルートの実装
- [ ] `ChatRoutingService`: conversation_id基軸のナビゲーション
- [ ] プロジェクト開始フローの統合
- [ ] ブラウザ履歴管理とブックマーク対応

#### 3.3 conversation_id状態管理
- [ ] `ConversationIdStore`: conversation_id専用状態管理
- [ ] セッション開始時のconversation_id取得待機
- [ ] URL同期とプロジェクト開始フロー統合

### Phase 4: Frontend - リアルタイム受信処理 🎯 **優先度：高**

#### 4.1 WebSocketリスナー拡張
- [ ] `handle-conversation-ready.ts`: conversation_id確定時の処理
- [ ] `handle-transcript-update.ts`: 新規メッセージ受信処理
- [ ] `conversation-message-streaming.ts`: ストリーミング風表示対応

#### 4.2 UI統合
- [ ] `ChatComponent`のconversation_id対応
- [ ] メッセージ表示の最適化
- [ ] ツール情報表示の改善

### Phase 5: システム統合とテスト 🧪 **優先度：中**

#### 5.1 統合テスト
- [ ] `conversation-id-integration.test.ts`: conversation_id管理のE2Eテスト
- [ ] `transcript-monitoring.test.ts`: transcript監視機能のテスト
- [ ] `routing-conversation-id.test.ts`: URL管理のテスト

#### 5.2 エラーハンドリング
- [ ] conversation_id未取得時の適切な処理
- [ ] SQLite3アクセスエラー時の回復処理
- [ ] セッション復元時のconversation_id復旧

### Phase 6: パフォーマンス最適化 ⚡ **優先度：低**

#### 6.1 効率化
- [ ] SQLite3クエリの最適化（インデックス活用）
- [ ] transcript配列の差分検出アルゴリズム改善
- [ ] メモリ使用量の最適化

#### 6.2 スケーラビリティ
- [ ] 複数conversation同時監視対応
- [ ] 長期間セッションのメモリ管理
- [ ] 大量メッセージ処理の最適化

## 技術仕様

### データフロー（改良版）
```
1. ユーザー: /chat画面でプロジェクトパス入力 → pi-arrow-rightボタンクリック
2. Frontend: ボタン → ローディングスピナー表示
3. Backend: Amazon Q CLIプロセス起動
4. SQLite3: 新規conversation_id挿入（数秒後）
5. Backend: conversation_id検知 → WebSocketで通知
6. Frontend: conversation_id受信 → /chat/:conversation_idに自動遷移
7. ユーザー: メッセージ送信
8. SQLite3: transcript配列更新
9. Backend: 変更検知 → 新規メッセージ抽出
10. Frontend: リアルタイム表示更新
```

### 型定義拡張
```typescript
// Backend
interface QProcessSession {
  sessionId: string;
  conversationId: string | null;
  projectPath: string;
  isWaitingForConversationId: boolean;
  lastTranscriptLength: number;
}

// Frontend
interface ConversationState {
  conversationId: string | null;
  isReady: boolean;
  messages: ConversationMessage[];
  isLoading: boolean;
}

// Project Start State
interface ProjectStartState {
  projectPath: string;
  isStarting: boolean;
  isWaitingForConversationId: boolean;
  error: string | null;
}

// WebSocket Events
interface ConversationReadyEvent {
  sessionId: string;
  conversationId: string;
  projectPath: string;
}

interface TranscriptUpdateEvent {
  conversationId: string;
  newMessages: string[];
  tools: string[];
}
```

### URL設計（改良版）
```
/chat                           → New Project画面（プロジェクトパス入力）
/chat/:conversation_id          → 特定conversation表示
/chat/:conversation_id/history  → conversation履歴表示（将来拡張）
```

### UI/UXフロー
```
┌─────────────────┐    プロジェクトパス入力     ┌──────────────────┐
│   /chat画面     │ ──────────────────→    │  pi-arrow-right  │
│ (New Project)   │                         │     ボタン       │
└─────────────────┘                         └──────────────────┘
                                                     │
                                                     ▼ クリック
                                            ┌──────────────────┐
                                            │  ローディング     │
                                            │   スピナー       │
                                            │ (conversation_id │
                                            │    取得待ち)     │
                                            └──────────────────┘
                                                     │
                                                     ▼ conversation_id取得
                                            ┌──────────────────┐
                                            │ /chat/:conv_id   │
                                            │   チャット画面    │
                                            │  (リアルタイム)   │
                                            └──────────────────┘
```

## 実装手順

### Week 1: Core Backend Implementation
1. ✅ conversation_id追跡システムの実装
2. ✅ セッション管理の拡張
3. ✅ WebSocketイベントの追加

### Week 2: Frontend Integration
1. ✅ ルーティング変更の実装
2. ✅ 状態管理の更新
3. ✅ UI統合とテスト

### Week 3: Testing & Optimization
1. ✅ 統合テストの実装
2. ✅ エラーハンドリングの改善
3. ✅ パフォーマンス最適化

## 期待される効果

### 解決される問題
- ✅ 「Hello! I'm Amazon Q...」以外のレスポンス表示
- ✅ リアルタイムチャット体験の実現
- ✅ conversation_id単位でのURL管理
- ✅ ブックマーク可能な会話リンク

### UI/UX改善
- ✅ 直感的なプロジェクト開始フロー
- ✅ ローディング状態の明確な表示
- ✅ スムーズな画面遷移
- ✅ エラー状態の適切なハンドリング

### システム改善
- ✅ 既存SQLite3インフラの完全活用
- ✅ 最小限のアーキテクチャ変更
- ✅ スケーラブルな監視システム
- ✅ 既存New Project画面の有効活用

## リスク管理

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| conversation_id取得の遅延 | 中 | 中 | タイムアウト設定とローディング表示 |
| SQLite3アクセス権限エラー | 高 | 低 | 権限チェックとエラー回復 |
| 大量メッセージでの性能劣化 | 中 | 低 | 差分検出とページネーション |
| Amazon Q CLI仕様変更 | 高 | 低 | バージョン固定と監視体制 |

## 成功指標

### 機能性
- [ ] conversation_id基軸のURL管理が動作
- [ ] リアルタイムメッセージ受信（100ms以内）
- [ ] ツール情報の正確な表示

### パフォーマンス
- [ ] conversation_id取得時間 < 5秒
- [ ] メッセージ表示遅延 < 100ms
- [ ] SQLite3監視負荷 < 1% CPU

### ユーザビリティ
- [ ] 直感的なURL管理
- [ ] ブックマーク可能な会話リンク
- [ ] エラー時の適切なフィードバック