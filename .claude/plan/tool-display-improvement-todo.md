# Amazon Q CLIツール表示改善実装計画書

**こちらは実装ごとにチェックボックスをつけて進捗がわかるようにすること**

## 概要

Amazon Q CLIがツール（MCP等）を使用する際の表示を改善し、以下の形式での表示を実現する：

```
AIの回答内容がここに表示されます。
ファイルを読み取って内容を確認します。

tools: fs_read,github_mcp
```

### 技術的な課題

- Amazon Q CLIはストリーミング形式で出力するため、`[Tool uses: ツール名]` が複数チャンクに分かれる可能性
- リアルタイムチャット中での検出とUI更新が必要
- 既存の履歴データとの互換性維持

## Phase 1: バックエンド - ツール検出パーサーの実装

### TODO リスト

- [ ] ツール検出パーサーモジュールの作成
  - [ ] `apps/backend/src/services/amazon-q-message-parser/` ディレクトリを作成
  - [ ] `apps/backend/src/services/amazon-q-message-parser/parse-tool-usage.ts` ファイルを作成
    - [ ] 正規表現パターン `/\[Tool uses: ([^\]]+)\]/g` による検出機能
    - [ ] 複数ツールのカンマ区切り対応（例：`fs_read, github_mcp`）
    - [ ] 不完全なパターンの検出（ストリーミング対応）
  - [ ] `apps/backend/src/services/amazon-q-message-parser/extract-content-and-tools.ts` ファイルを作成
    - [ ] メッセージ本文とツール情報の分離機能
    - [ ] ツール使用行の除去機能
    - [ ] 改行とフォーマットの適切な処理
  - [ ] `apps/backend/src/services/amazon-q-message-parser/tool-detection-buffer.ts` ファイルを作成
    - [ ] ストリーミング用のバッファリング機能
    - [ ] 不完全なツールパターンの蓄積・検出
    - [ ] バッファクリア機能
  - [ ] `apps/backend/src/services/amazon-q-message-parser/index.ts` ファイルを作成（エクスポート集約）
  - [ ] 各パーサー関数のユニットテストを作成
    - [ ] 正常系：完全なツールパターンの検出
    - [ ] 正常系：複数ツールの検出
    - [ ] 異常系：不完全なパターンの処理
    - [ ] 異常系：存在しないツールパターン

- [ ] 型定義の拡張
  - [ ] `apps/backend/src/types/amazon-q.ts` を編集
    - [ ] `ToolInfo` インターフェースを追加
      ```typescript
      interface ToolInfo {
        name: string;
        detected: boolean;
        timestamp: number;
      }
      ```
    - [ ] `QResponseEvent` インターフェースを拡張
      ```typescript
      interface QResponseEvent {
        sessionId: string;
        data: string;
        type: 'stream' | 'error' | 'info' | 'completion';
        tools?: string[]; // 新規追加
        hasToolContent?: boolean; // 新規追加
      }
      ```
    - [ ] `ParsedMessage` インターフェースを追加
      ```typescript
      interface ParsedMessage {
        content: string;
        tools: string[];
        hasToolContent: boolean;
        originalMessage: string;
      }
      
      interface ToolDetectionBuffer {
        buffer: string;
        detectedTools: string[];
        processChunk(chunk: string): { content: string; tools: string[] };
        clear(): void;
      }
      ```

## Phase 2: バックエンド - メッセージハンドラーの更新

### TODO リスト

- [ ] セッション管理の拡張
  - [ ] `apps/backend/src/services/amazon-q-cli/session-manager/types.ts` を編集
    - [ ] `QProcessSession` インターフェースにツール管理フィールドを追加
      ```typescript
      interface QProcessSession {
        // 既存フィールド...
        currentTools: string[]; // 新規追加
        toolBuffer: string; // 新規追加
        toolDetectionBuffer: ToolDetectionBuffer; // 新規追加
      }
      ```

- [ ] メッセージハンドラーの更新
  - [ ] `apps/backend/src/services/amazon-q-cli/message-handler/handle-stdout.ts` を編集
    - [ ] ツールパーサーの統合
      ```typescript
      import { parseToolUsage, extractContentAndTools } from '../../../amazon-q-message-parser';
      ```
    - [ ] 行処理ループでのツール検出処理を追加（31-61行付近）
      ```typescript
      const toolDetection = parseToolUsage(cleanLine);
      if (toolDetection.hasTools) {
        session.currentTools = [...(session.currentTools || []), ...toolDetection.tools];
        // ツール行はスキップして表示しない
        continue;
      }
      ```
    - [ ] レスポンスイベントにツール情報を含める
      ```typescript
      const responseEvent: QResponseEvent = {
        sessionId: session.sessionId,
        data: cleanLine + '\n',
        type: 'stream',
        tools: session.currentTools || [],
        hasToolContent: (session.currentTools || []).length > 0
      };
      ```
  - [ ] `apps/backend/src/services/amazon-q-cli/message-handler/is-tool-usage-line.ts` ファイルを作成
    - [ ] ツール使用行の判定機能
    - [ ] ツール行のスキップ判定機能

- [ ] セッション初期化とクリアの更新
  - [ ] `apps/backend/src/services/amazon-q-cli/session-manager/create-session.ts` を編集
    - [ ] セッション作成時のツールフィールド初期化
  - [ ] `apps/backend/src/services/amazon-q-cli/session-manager/abort-session.ts` を編集
    - [ ] セッション終了時のツール情報クリア

## Phase 3: フロントエンド - 型定義とUI表示の拡張

### TODO リスト

- [ ] フロントエンド型定義の拡張
  - [ ] `apps/frontend/src/app/core/store/chat/chat.state.ts` を編集
    - [ ] `ChatMessage` インターフェースにツールフィールドを追加
      ```typescript
      export interface ChatMessage {
        id: MessageId;
        content: string;
        sender: AmazonQMessageSender;
        timestamp: Timestamp;
        isTyping?: boolean;
        sessionId?: SessionId;
        tools?: string[]; // 新規追加
        hasToolContent?: boolean; // 新規追加
      }
      ```
  - [ ] `apps/frontend/src/app/core/types/websocket.types.ts` を編集（バックエンドと同期）
    - [ ] WebSocketイベント型にツール情報を追加

- [ ] UI コンポーネントの更新
  - [ ] `apps/frontend/src/app/shared/components/amazon-q-message/amazon-q-message.component.html` を編集
    - [ ] ツール表示セクションを追加
      ```html
      <!-- 既存のメッセージ内容 -->
      <div class="message-content">
        {{ message.content }}
        <span *ngIf="message.isTyping" class="typing-indicator">...</span>
      </div>
      
      <!-- 新規：ツール情報表示 -->
      <div *ngIf="message.tools && message.tools.length > 0" 
           class="tools-section">
        <span class="tools-label">tools:</span>
        <span class="tools-list">{{ message.tools.join(',') }}</span>
      </div>
      ```
  - [ ] `apps/frontend/src/app/shared/components/amazon-q-message/amazon-q-message.component.scss` を編集
    - [ ] ツール表示のスタイリング追加
      ```scss
      .tools-section {
        margin-top: 8px;
        padding: 6px 12px;
        background-color: var(--surface-100);
        border-radius: 4px;
        font-size: 0.85em;
        color: var(--text-color-secondary);
        
        .tools-label {
          font-weight: 500;
          margin-right: 4px;
        }
        
        .tools-list {
          font-family: 'Monaco', 'Menlo', monospace;
          color: var(--primary-color);
        }
      }
      ```
  - [ ] `apps/frontend/src/app/shared/components/amazon-q-message/amazon-q-message.component.ts` を編集
    - [ ] ツール情報のプロパティ処理を追加

- [ ] ユーティリティ関数の作成
  - [ ] `apps/frontend/src/app/shared/utils/formatters/` ディレクトリに追加
    - [ ] `tools-formatter.ts` ファイルを作成
      - [ ] ツールリストのフォーマット機能
      - [ ] ツール名の正規化機能
      - [ ] 表示用ツール名の変換機能
    - [ ] ユニットテストを作成

## Phase 4: フロントエンド - ストリーミング処理の更新

### TODO リスト

- [ ] ストリーミング処理の更新
  - [ ] `apps/frontend/src/app/features/chat/services/message-streaming/handle-streaming-update.ts` を編集
    - [ ] ツール情報の累積更新機能を追加
      ```typescript
      export function handleStreamingUpdate(
        content: string,
        tools: string[] = [], // 新規追加
        streamingMessageId: string,
        // ... 既存パラメータ
      ): void {
        // 既存のコンテンツ更新処理...
        
        // 新規：ツール情報の更新
        if (tools.length > 0) {
          const currentMessage = getCurrentMessages()[messageIndex];
          const updatedTools = [
            ...(currentMessage.tools || []),
            ...tools.filter(tool => !currentMessage.tools?.includes(tool))
          ];
          
          updateChatMessage(streamingMessageId, { 
            content: updatedContent,
            tools: updatedTools,
            hasToolContent: updatedTools.length > 0
          });
        } else {
          updateChatMessage(streamingMessageId, { content: updatedContent });
        }
      }
      ```

- [ ] WebSocketイベントハンドラーの更新
  - [ ] `apps/frontend/src/app/features/chat/services/chat-websocket/handle-streaming-response.ts` を編集
    - [ ] バックエンドからのツール情報を処理
      ```typescript
      export function handleStreamingResponse(
        data: QResponseEvent,
        // ... 既存パラメータ
      ): void {
        // 既存の処理...
        
        // 新規：ツール情報の抽出と処理
        const tools = data.tools || [];
        const hasToolContent = data.hasToolContent || false;
        
        handleStreamingUpdate(
          data.data,
          tools, // ツール情報を追加
          streamingMessageId,
          // ... その他既存パラメータ
        );
      }
      ```

- [ ] チャット状態管理の更新
  - [ ] `apps/frontend/src/app/core/store/chat/actions/` ディレクトリに追加
    - [ ] `update-message-tools.ts` ファイルを作成
      - [ ] メッセージのツール情報更新機能
      - [ ] ツール重複チェック機能
    - [ ] `add-chat-message.ts` を編集
      - [ ] メッセージ追加時のツール情報初期化
    - [ ] ユニットテストを作成

## Phase 5: テストとデバッグ

### TODO リスト

- [ ] バックエンドテストの作成・更新
  - [ ] `apps/backend/src/tests/services/amazon-q-message-parser/` ディレクトリを作成
    - [ ] `parse-tool-usage.test.ts` ファイルを作成
      - [ ] 正常系：標準的なツールパターンのテスト
      - [ ] 正常系：複数ツールパターンのテスト
      - [ ] 正常系：ストリーミング分割パターンのテスト
      - [ ] 異常系：不正なパターンのテスト
      - [ ] 境界値：空文字、null、undefinedのテスト
    - [ ] `tool-detection-buffer.test.ts` ファイルを作成
      - [ ] バッファリング機能のテスト
      - [ ] 不完全パターンの蓄積・検出テスト

  - [ ] `apps/backend/src/tests/services/amazon-q-cli/message-handler/` ディレクトリを更新
    - [ ] `handle-stdout.test.ts` を編集
      - [ ] ツール検出機能の統合テスト
      - [ ] ツール情報付きレスポンスのテスト
      - [ ] ツール行スキップ機能のテスト

- [ ] フロントエンドテストの作成・更新
  - [ ] `apps/frontend/src/app/shared/components/amazon-q-message/` ディレクトリにテスト追加
    - [ ] `amazon-q-message.component.spec.ts` を編集
      - [ ] ツール表示機能のテスト
      - [ ] ツール情報あり・なしの表示分岐テスト
      - [ ] ツールフォーマット表示のテスト

  - [ ] `apps/frontend/src/app/features/chat/services/message-streaming/` ディレクトリにテスト追加
    - [ ] `handle-streaming-update.spec.ts` を編集
      - [ ] ツール情報累積更新のテスト
      - [ ] 重複ツール排除のテスト
      - [ ] ストリーミング中のツール表示更新テスト

- [ ] 統合テストの作成
  - [ ] `apps/backend/src/tests/integration/` ディレクトリに追加
    - [ ] `amazon-q-tool-detection.integration.test.ts` ファイルを作成
      - [ ] 実際のAmazon Q CLI出力でのツール検出テスト
      - [ ] WebSocket経由でのツール情報送信テスト
      - [ ] セッション間でのツール情報管理テスト

  - [ ] `apps/frontend/src/app/features/chat/` ディレクトリに統合テスト追加
    - [ ] `tool-display.integration.spec.ts` ファイルを作成
      - [ ] WebSocketからツール情報受信のテスト
      - [ ] UI表示更新の統合テスト
      - [ ] ストリーミング中のリアルタイム更新テスト

- [ ] E2Eテストの作成
  - [ ] 実際のAmazon Q CLIとの連携テスト環境構築
  - [ ] ツール使用時の画面表示確認テスト
  - [ ] 複数ツール使用時の表示確認テスト

- [ ] デバッグとパフォーマンステスト
  - [ ] ツール検出のパフォーマンス測定
  - [ ] ストリーミング処理のメモリ使用量確認
  - [ ] 大量メッセージ処理時の動作確認
  - [ ] 各ブラウザでの表示確認（Chrome、Firefox、Safari）

## Phase 6: ドキュメントとリリース準備

### TODO リスト

- [ ] ドキュメントの更新
  - [ ] `CLAUDE.md` にツール表示機能の説明を追加
  - [ ] API仕様書の更新（WebSocketイベント仕様）
  - [ ] フロントエンド開発ガイドの更新

- [ ] コードレビューと品質確認
  - [ ] ESLintエラーの解消
  - [ ] TypeScriptエラーの解消
  - [ ] Prettierフォーマットの適用
  - [ ] コードカバレッジの確認（目標：80%以上）

- [ ] パフォーマンス最適化
  - [ ] ツール検出処理の最適化
  - [ ] ストリーミング処理の最適化
  - [ ] バンドルサイズの影響確認

- [ ] 後方互換性の確認
  - [ ] 既存のチャット履歴表示が正常に動作することを確認
  - [ ] ツール情報なしのメッセージが正常に表示されることを確認
  - [ ] 従来のWebSocketイベントが正常に処理されることを確認

## 実装優先度

1. **Phase 1 & 2** (高優先度): バックエンドの基盤実装
2. **Phase 3** (高優先度): フロントエンドの基本表示機能
3. **Phase 4** (中優先度): ストリーミング処理の改善
4. **Phase 5** (中優先度): テストとデバッグ
5. **Phase 6** (低優先度): ドキュメントとリリース準備

## 注意事項

- 既存の機能に影響を与えないよう、段階的に実装する
- 各フェーズ完了後に動作確認を行う
- ツール検出機能が失敗した場合でも、従来の表示方法にフォールバックできるように実装する
- パフォーマンスへの影響を最小限に抑える

---

_作成日: 2025-07-20_
_最終更新日: 2025-07-20_