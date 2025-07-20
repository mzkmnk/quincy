# 開発者ガイド

## 目次

1. [概要](#概要)
2. [開発環境のセットアップ](#開発環境のセットアップ)
3. [プロジェクト構造](#プロジェクト構造)
4. [アーキテクチャ原則](#アーキテクチャ原則)
5. [開発ワークフロー](#開発ワークフロー)
6. [コード規約](#コード規約)
7. [テスト戦略](#テスト戦略)
8. [新機能の追加](#新機能の追加)
9. [トラブルシューティング](#トラブルシューティング)
10. [よくある質問](#よくある質問)

## 概要

このプロジェクトは、Amazon Q CLIとの統合を提供するWebSocketベースのバックエンドサービスです。2025年7月にリファクタリングが完了し、1ファイル1関数アーキテクチャを採用しています。

### 主要な技術スタック

- **Backend**: Node.js + TypeScript + Express
- **Frontend**: Angular 20 + Standalone Components
- **WebSocket**: Socket.IO
- **Database**: SQLite3
- **Testing**: Jest + Karma/Jasmine
- **Package Manager**: pnpm

## 開発環境のセットアップ

### 前提条件

- Node.js 18.x以上
- pnpm 8.x以上
- Amazon Q CLI (インストール済み)
- Git

### インストール手順

1. **リポジトリのクローン**

   ```bash
   git clone <repository-url>
   cd backend-arc
   ```

2. **依存関係のインストール**

   ```bash
   pnpm install
   ```

3. **開発サーバーの起動**

   ```bash
   # バックエンドとフロントエンドを同時に起動
   pnpm dev:backend & pnpm dev:frontend

   # または個別に起動
   pnpm --filter backend dev
   pnpm --filter frontend start
   ```

4. **動作確認**
   - Backend: http://localhost:3000/health
   - Frontend: http://localhost:4200

## プロジェクト構造

```
backend-arc/
├── apps/
│   ├── backend/                 # バックエンドアプリケーション
│   │   ├── src/
│   │   │   ├── services/        # ビジネスロジック
│   │   │   ├── utils/           # 共通ユーティリティ
│   │   │   ├── types/           # 型定義
│   │   │   ├── tests/           # テストファイル
│   │   │   └── routes/          # API エンドポイント
│   │   └── package.json
│   └── frontend/                # フロントエンドアプリケーション
│       └── src/
├── .claude/                     # Claude Code関連ドキュメント
│   └── docs/
├── pnpm-workspace.yaml          # pnpmワークスペース設定
└── CLAUDE.md                    # プロジェクト指示書
```

### バックエンドの詳細構造

```
src/
├── services/                    # サービス層（1ファイル1関数）
│   ├── amazon-q-cli/           # Amazon Q CLI統合
│   │   ├── buffer-manager/     # バッファ管理
│   │   ├── cli-checker/        # CLI検証
│   │   ├── message-handler/    # メッセージ処理
│   │   ├── process-manager/    # プロセス管理
│   │   └── session-manager/    # セッション管理
│   ├── amazon-q-history/       # 履歴データ取得
│   ├── amazon-q-history-transformer/  # 履歴変換
│   ├── amazon-q-message-formatter/    # メッセージフォーマット
│   └── websocket/              # WebSocket機能
│       ├── amazon-q-handler/   # Amazon Q WebSocket処理
│       ├── connection-manager/ # 接続管理
│       ├── error-handler/      # エラー処理
│       └── room-manager/       # ルーム管理
├── utils/                      # ユーティリティ層
│   ├── ansi-stripper/         # ANSI除去
│   ├── cli-validator/         # CLI検証
│   ├── error-factory/         # エラー生成
│   ├── errors/                # エラークラス
│   ├── id-generator/          # ID生成
│   └── path-validator/        # パス検証
├── types/                     # 型定義
│   ├── amazon-q.ts           # Amazon Q関連型
│   ├── common.ts             # 共通型
│   └── websocket.ts          # WebSocket型
└── tests/                    # テストファイル
    ├── *.test.ts            # 単体テスト
    ├── *.integration.test.ts # 結合テスト
    └── end-to-end.test.ts   # E2Eテスト
```

## アーキテクチャ原則

### 1. 1ファイル1関数原則

各ファイルは1つの主要な関数のみを含みます。

**良い例**:

```typescript
// src/utils/id-generator/generate-message-id.ts
export function generateMessageId(): MessageId {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as MessageId;
}
```

**悪い例**:

```typescript
// 複数の関数を含む
export function generateMessageId(): MessageId {
  /* */
}
export function generateSessionId(): SessionId {
  /* */
}
export function generateUserId(): UserId {
  /* */
}
```

### 2. モジュール構造

関連する機能は同じディレクトリにグループ化し、`index.ts`でエクスポートします。

```typescript
// src/utils/id-generator/index.ts
export { generateId } from './generate-id';
export { generateMessageId } from './generate-message-id';
export { generateSessionId } from './generate-session-id';
```

### 3. 型安全性

TypeScriptの型システムを最大限活用します。

```typescript
// 型定義
export type MessageId = `msg_${string}`;
export type SessionId = `q_session_${string}`;

// 型ガード
export function isMessageId(value: string): value is MessageId {
  return value.startsWith('msg_');
}
```

### 4. エラーハンドリング

統一されたエラーハンドリングを使用します。

```typescript
import { createValidationError } from '../utils/error-factory';

export function validatePath(path: string): void {
  if (!path) {
    throw createValidationError('Path is required', { path });
  }
}
```

## 開発ワークフロー

### 1. ブランチ戦略

```bash
# 新機能の開発
git checkout -b feature/new-feature-name

# バグ修正
git checkout -b fix/bug-description

# リファクタリング
git checkout -b refactor/component-name
```

### 2. 開発手順

1. **要件の確認**
   - 仕様書の確認
   - 既存コードの理解

2. **テストの作成**（TDD）

   ```bash
   # テストファイルの作成
   touch src/tests/new-feature.test.ts

   # テストの実行
   pnpm test --watch
   ```

3. **実装**

   ```bash
   # 新しい機能の実装
   mkdir -p src/services/new-service
   touch src/services/new-service/index.ts
   ```

4. **テストの確認**

   ```bash
   # 全テストの実行
   pnpm test

   # 型チェック
   pnpm typecheck

   # ビルド確認
   pnpm build
   ```

5. **コミット**
   ```bash
   git add .
   git commit -m "feat: 新機能を追加"
   ```

### 3. プルリクエスト

1. **テストの通過確認**
2. **型チェックの通過確認**
3. **ビルドの通過確認**
4. **コードレビューの実施**

## コード規約

### 1. ファイル命名規則

```
# 関数ファイル
kebab-case.ts           # handle-connection.ts
kebab-case.test.ts      # handle-connection.test.ts

# 型定義ファイル
kebab-case.ts           # amazon-q.ts

# クラスファイル
PascalCase.ts           # AmazonQCLIService.ts
```

### 2. 関数命名規則

```typescript
// 動詞 + 名詞
function createSession() {}
function validatePath() {}
function generateId() {}

// boolean返却の場合はis/has/should等
function isValidPath() {}
function hasPermission() {}
function shouldSkipOutput() {}

// イベントハンドラー
function handleConnection() {}
function handleError() {}
```

### 3. インポート規則

```typescript
// 1. Node.jsモジュール
import { EventEmitter } from 'events';
import { spawn } from 'child_process';

// 2. 外部ライブラリ
import { Socket } from 'socket.io';
import express from 'express';

// 3. 内部モジュール（相対パス）
import { generateId } from '../utils/id-generator';
import { validatePath } from '../utils/path-validator';

// 4. 型定義
import type { MessageId, SessionId } from '../types/common';
```

### 4. コメント規則

```typescript
/**
 * Amazon Q CLIセッションを作成します
 * @param options - セッション作成オプション
 * @returns 作成されたセッション情報
 * @throws {ValidationError} オプションが無効な場合
 */
export function createSession(options: QProcessOptions): QProcessSession {
  // 実装
}
```

## テスト戦略

### 1. テストの種類

**単体テスト (Unit Tests)**

- 1つの関数のテスト
- モックを使用して依存関係を分離
- 高速実行

```typescript
// src/tests/id-generator.test.ts
describe('generateMessageId', () => {
  it('should generate message ID with correct format', () => {
    const messageId = generateMessageId();
    expect(messageId).toMatch(/^msg_\d+_[a-z0-9]+$/);
  });
});
```

**結合テスト (Integration Tests)**

- サービス間の連携テスト
- 実際のサービスを使用

```typescript
// src/tests/amazon-q-cli.integration.test.ts
describe('AmazonQCLIService Integration', () => {
  it('should execute command and return response', async () => {
    const service = new AmazonQCLIService();
    const session = await service.createSession(options);
    expect(session.sessionId).toBeDefined();
  });
});
```

**E2Eテスト (End-to-End Tests)**

- 完全なワークフローのテスト
- WebSocketを含む全体的な機能

```typescript
// src/tests/end-to-end.test.ts
describe('WebSocket + Amazon Q Integration', () => {
  it('should handle complete q:command workflow', async () => {
    // WebSocket接続からコマンド実行まで
  });
});
```

### 2. テストコマンド

```bash
# 全テスト実行
pnpm test

# 監視モード
pnpm test:watch

# 特定のテストファイル
pnpm test -- --testNamePattern="generateMessageId"

# カバレッジ付き
pnpm test -- --coverage
```

### 3. テストの書き方

```typescript
describe('関数名またはクラス名', () => {
  // セットアップ
  beforeEach(() => {
    // テスト前の準備
  });

  // 正常ケース
  it('should 期待される動作', () => {
    // arrange
    const input = 'test';

    // act
    const result = functionUnderTest(input);

    // assert
    expect(result).toBe(expected);
  });

  // 異常ケース
  it('should throw error when 異常条件', () => {
    expect(() => {
      functionUnderTest(invalidInput);
    }).toThrow('Expected error message');
  });
});
```

## 新機能の追加

### 1. 新しいユーティリティの追加

```bash
# 1. ディレクトリ作成
mkdir -p src/utils/new-utility

# 2. 関数ファイル作成
touch src/utils/new-utility/main-function.ts
touch src/utils/new-utility/helper-function.ts
touch src/utils/new-utility/index.ts

# 3. テストファイル作成
touch src/tests/new-utility.test.ts
```

**実装例**:

```typescript
// src/utils/new-utility/main-function.ts
export function mainFunction(input: string): string {
  // 実装
}

// src/utils/new-utility/index.ts
export { mainFunction } from './main-function';
export { helperFunction } from './helper-function';

// src/tests/new-utility.test.ts
describe('mainFunction', () => {
  it('should work correctly', () => {
    // テスト実装
  });
});
```

### 2. 新しいサービスの追加

```bash
# 1. サービスディレクトリ作成
mkdir -p src/services/new-service

# 2. サブモジュール作成
mkdir -p src/services/new-service/sub-module

# 3. ファイル作成
touch src/services/new-service/sub-module/function-name.ts
touch src/services/new-service/sub-module/index.ts
touch src/services/new-service/index.ts

# 4. テストファイル作成
touch src/tests/new-service.integration.test.ts
```

### 3. 新しい型定義の追加

```typescript
// src/types/new-types.ts
export interface NewInterface {
  id: string;
  name: string;
  createdAt: Date;
}

export type NewType = 'type1' | 'type2' | 'type3';

// 型ガード
export function isNewType(value: string): value is NewType {
  return ['type1', 'type2', 'type3'].includes(value);
}

// src/types/index.ts に追加
export * from './new-types';
```

### 4. 新しいWebSocketイベントの追加

```typescript
// 1. ハンドラー関数の作成
// src/services/websocket/amazon-q-handler/handle-new-event.ts
export function handleNewEvent(socket: Socket, data: NewEventData): void {
  // 実装
}

// 2. イベントセットアップに追加
// src/services/websocket/event-setup/setup-event-handlers.ts
socket.on('new:event', data => handleNewEvent(socket, data));

// 3. 型定義の追加
// src/types/websocket.ts
export interface NewEventData {
  // データ構造
}
```

## トラブルシューティング

### よくある問題

#### 1. Amazon Q CLIが見つからない

**症状**: `Q_CLI_NOT_FOUND` エラー

**解決方法**:

```bash
# Amazon Q CLIの確認
which q
q --version

# パスの確認
echo $PATH

# 環境変数の設定
export Q_CLI_PATH=/usr/local/bin/q
```

#### 2. WebSocket接続エラー

**症状**: フロントエンドからの接続が失敗

**解決方法**:

```bash
# サーバーの起動確認
curl http://localhost:3000/health

# WebSocketの確認
curl http://localhost:3000/websocket/status

# CORS設定の確認
# src/index.ts のCORS設定を確認
```

#### 3. データベースエラー

**症状**: 履歴取得時のエラー

**解決方法**:

```bash
# SQLiteファイルの確認
ls -la ~/.amazonq/

# データベースの権限確認
stat ~/.amazonq/cli-history.db
```

#### 4. テストの失敗

**症状**: テストが予期しない理由で失敗

**解決方法**:

```bash
# キャッシュクリア
pnpm test -- --clearCache

# 詳細ログ
pnpm test -- --verbose

# 特定のテストのみ実行
pnpm test -- --testNamePattern="問題のテスト名"
```

#### 5. 型エラー

**症状**: TypeScriptコンパイルエラー

**解決方法**:

```bash
# 型チェック
pnpm typecheck

# 型定義の再生成
rm -rf node_modules/@types
pnpm install

# TypeScriptのバージョン確認
npx tsc --version
```

### デバッグのコツ

#### 1. ログの活用

```typescript
// 開発時のみログを出力
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

#### 2. テストでのデバッグ

```typescript
// テスト内でのデバッグ
it('should debug test', () => {
  const result = functionUnderTest(input);
  console.log('Result:', result); // テスト実行時に出力
  expect(result).toBe(expected);
});
```

#### 3. WebSocketデバッグ

```typescript
// WebSocketイベントのログ
socket.on('connect', () => {
  console.log('WebSocket connected');
});

socket.on('disconnect', reason => {
  console.log('WebSocket disconnected:', reason);
});
```

## よくある質問

### Q1: 新しい関数を追加したい場合、どこに置けばよいですか？

A1: 機能に応じて適切なディレクトリに配置してください：

- **共通ユーティリティ**: `src/utils/[category]/`
- **ビジネスロジック**: `src/services/[service]/[category]/`
- **型定義**: `src/types/`

### Q2: テストはどの程度書けばよいですか？

A2: 以下の基準を目安にしてください：

- **ユーティリティ関数**: 100%のテストカバレッジ
- **サービス関数**: 主要なパスのテスト
- **エラーハンドリング**: 異常ケースのテスト

### Q3: 既存のコードを変更する場合の注意点は？

A3:

- 既存のテストが通ることを確認
- 後方互換性を保つ
- 変更の影響範囲を確認
- レビューを受ける

### Q4: パフォーマンスが気になる場合は？

A4:

- プロファイリングツールの使用
- 非同期処理の最適化
- メモリリークの確認
- データベースクエリの最適化

### Q5: 新しい依存関係を追加する場合は？

A5:

- 必要性を十分検討
- ライセンスの確認
- セキュリティの確認
- チームでの合意

## まとめ

このガイドは、プロジェクトの開発に必要な基本的な知識を提供しています。新しい機能の追加や既存コードの改善の際は、このガイドを参考にして、一貫性のあるコードを書くようにしてください。

質問や不明な点があれば、チームメンバーに相談するか、プロジェクトのドキュメントを確認してください。
