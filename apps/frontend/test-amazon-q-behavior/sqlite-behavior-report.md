# Amazon Q CLI SQLite動作検証レポート

## 検証日時

2025年7月21日

## 検証環境

- ディレクトリ: `/Users/username/dev/quincy-worktrees/stdio-termination-detection/apps/frontend/test-amazon-q-behavior`
- Amazon Q CLI バージョン: 1.x
- SQLiteデータベース: `~/Library/Application Support/amazon-q/data.sqlite3`

## SQLiteテーブル構造

```sql
CREATE TABLE conversations (
    key TEXT PRIMARY KEY,    -- プロジェクトの絶対パス
    value TEXT              -- JSON形式のconversationデータ
)
```

## 重要な発見事項

### 1. PRIMARY KEY制約による動作

- `key`フィールドがPRIMARY KEYのため、同じディレクトリパスに対しては**1つのレコードのみ**存在可能
- 新しい`q chat`セッションは既存レコードを**完全に上書き**する

### 2. conversation_idの変更パターン

過去の実行履歴から確認されたconversation_idの変遷：

1. **初期状態**: `7e956466-26ef-4fcf-a7c4-8a4f53dde6a8`
2. **セッション1後**: `0968ef09-24ce-440d-b369-e63865a0bc6e` （新規生成・上書き）
3. **セッション2後**: `efb874e1-aa2e-4bac-ae8e-d018e9f1ee39` （新規生成・上書き）

### 3. データの確認クエリ

同一ディレクトリのレコード数を確認：

```sql
SELECT COUNT(*) FROM conversations
WHERE key = '/Users/username/dev/quincy-worktrees/stdio-termination-detection/apps/frontend/test-amazon-q-behavior';
-- 結果: 1 （常に1つのみ）
```

### 4. --resumeオプションの動作

- 現在のディレクトリパスに対応する唯一のレコードを参照
- transcriptに新しいメッセージを追加（累積型）
- 過去のconversation_idは完全に失われているため、復元不可能

## システム設計への影響

### 問題点

1. conversation_idは永続的ではない
2. 新しいセッションで過去の履歴が失われる
3. 複数の履歴を保持できない

### 推奨される対応策

1. **プロジェクトパスを主要な識別子として使用**

   ```typescript
   // conversation_idではなく、プロジェクトパスで管理
   const projectPath = '/path/to/project';
   const currentData = await getConversationByPath(projectPath);
   ```

2. **conversation_id変更の検知と対応**
   - SQLite監視時にconversation_idの変更を検知
   - UIを適切に更新

3. **重要な会話の外部バックアップ**
   - 新しいセッションで上書きされる前に保存

## 結論

Amazon Q CLIのSQLiteデータベースは、ディレクトリパスごとに**1つのconversationレコードのみ**を保持します。新しい`q chat`セッションは既存のデータを完全に上書きし、新しいconversation_idを生成します。これは、システム設計において考慮すべき重要な制約です。
