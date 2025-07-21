# New Project フロー修正計画

## 問題の概要

現在、new projectでパスを入力した後、`Hello! I'm Amazon Q, your AI coding assistant. How can I help you with your project today?`という静的文字しか表示されず、実際のチャットができない状態。

## 現在の実装フロー分析

### 1. フロントエンド側の流れ

1. **PathSelectorComponent** (`path-selector.component.ts`)
   - ユーザーがプロジェクトパスを入力
   - 「開始」ボタンをクリック
   - `startProject()` 関数を呼び出し

2. **startProject関数** (`start-project.ts`)
   ```typescript
   // プロジェクトセッションを開始
   websocket.startProjectSession(trimmedPath, resumeSession);
   
   // conversation_idリスナーを設定
   websocket.setupConversationListeners(
     // onConversationReady - conversation_id確定時の処理
     (conversationData) => {
       router.navigate(['/chat', conversationData.conversationId]);
     }
   );
   ```

3. **WebSocketイベント待機**
   - `conversation:ready` イベントを待機
   - conversation_idが来たら `/chat/:conversation_id` に遷移

### 2. バックエンド側の流れ

1. **handleQProjectStart** (`handle-q-project-start.ts`)
   - Amazon Q CLIプロセスを起動
   - `q:session:started` イベントを発火

2. **問題点: conversation追跡が開始されていない**
   - `handleConversationTranscriptUpdate()` が呼ばれていない
   - SQLite3監視が開始されていない
   - conversation_idの取得処理が動いていない

## 根本原因

`handleQProjectStart`でAmazon Q CLIプロセスを起動した後、**conversation追跡システムが自動的に開始されていない**。

## 修正計画

### 1. バックエンドの修正

#### A. `handle-q-project-start.ts` の修正
```typescript
// Amazon Q CLIプロセス起動後に追加
import { handleConversationTranscriptUpdate } from './handle-conversation-transcript-update';

// セッション開始後
socket.emit('q:session:started', sessionStartedEvent);

// conversation追跡を開始
const roomId = `session-${sessionId}`;
socket.join(roomId);

await handleConversationTranscriptUpdate(
  socket.server as SocketIOServer,
  session,
  roomId
);
```

#### B. または、`setup-q-cli-event-handlers.ts` に追加
```typescript
// q:session:started イベントのハンドラーを追加
qCliService.on('q:session:started', async (data) => {
  const session = qCliService.getSession(data.sessionId);
  if (session) {
    const roomId = `session-${data.sessionId}`;
    await handleConversationTranscriptUpdate(io, session, roomId);
  }
});
```

### 2. フロントエンドの修正（オプション）

#### A. ローディング状態の改善
- 「開始」ボタンをクリック後、ローディング状態に変更
- conversation_id待機中であることを明示
- タイムアウト時のエラー表示を改善

#### B. デバッグ情報の追加
- WebSocketイベントのログ出力
- conversation追跡の状態表示

### 3. 実装手順

1. **バックエンドの修正**
   - `handleQProjectStart`でconversation追跡を開始
   - または、`q:session:started`イベントハンドラーで開始

2. **動作確認**
   - SQLite3監視が開始されることを確認
   - conversation_idが取得されることを確認
   - フロントエンドに`conversation:ready`イベントが届くことを確認

3. **フロントエンドの改善**
   - ローディング状態の実装
   - エラーハンドリングの改善

## 期待される動作

1. ユーザーがプロジェクトパスを入力して「開始」をクリック
2. ボタンがローディング状態に変化
3. バックエンドでAmazon Q CLIプロセスが起動
4. SQLite3監視が自動的に開始
5. conversation_idが検出されたら、フロントエンドに通知
6. チャット画面に遷移して、実際のチャットが可能に

## テスト項目

1. 新規プロジェクトでconversation_idが取得できること
2. SQLite3の変更が検知されること
3. チャットメッセージが表示されること
4. エラー時の適切なメッセージ表示
5. タイムアウト処理が正しく動作すること