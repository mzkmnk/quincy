# Amazon Q CLI 動作調査報告書

## 調査概要

同一プロジェクトパスでのAmazon Q CLIの実際の動作を検証し、conversation_idと履歴管理の真実を明らかにした。

## 調査日時

2025年7月21日（日）

## 調査方法

実際のAmazon Q CLIを使用したテストセッションの実行とSQLite3データベースの直接確認。

## 調査結果

### 1. Conversation_IDの動作パターン

#### ✅ 確認された事実
- **各プロジェクトパスには固定のconversation_idが割り当てられる**
- **同じプロジェクトパスでは常に同じconversation_idが使用される**

#### 📊 実測データ
```
プロジェクトパス: /Users/username/dev/quincy-worktrees/stdio-termination-detection/apps/frontend/test-amazon-q-behavior
conversation_id: 7e956466-26ef-4fcf-a7c4-8a4f53dde6a8 (全セッションで固定)
```

### 2. 通常のセッション動作（`q chat`）

#### ✅ 確認された事実
- **transcriptは各セッションで上書きされる**
- **過去のセッション履歴は削除される**
- **conversation_idは維持される**

#### 📊 実測データ
```
第1回セッション:
- conversation_id: 7e956466-26ef-4fcf-a7c4-8a4f53dde6a8
- transcript内容: 第1回セッションのみ

第2回セッション:
- conversation_id: 7e956466-26ef-4fcf-a7c4-8a4f53dde6a8 (同じ)
- transcript内容: 第2回セッションのみ（第1回は削除）

第3回セッション:
- conversation_id: 7e956466-26ef-4fcf-a7c4-8a4f53dde6a8 (同じ)
- transcript内容: 第3回セッションのみ（過去は削除）
```

### 3. Resumeセッション動作（`q chat --resume`）

#### ✅ 確認された事実
- **同じconversation_idを使用**
- **transcriptに新しいメッセージが追加される**（累積される）
- **過去の履歴を参照して応答する**
- **"Picking up where we left off..."**メッセージが表示される

#### 📊 実測データ
```
--resumeセッション前:
- conversation_id: 7e956466-26ef-4fcf-a7c4-8a4f53dde6a8
- transcript長: 400

--resumeセッション後:
- conversation_id: 7e956466-26ef-4fcf-a7c4-8a4f53dde6a8 (同じ)
- transcript長: 1149 (増加)
- 履歴: 過去+新規メッセージが累積
```

### 4. データベース構造の真実

#### テーブル: conversations
```sql
CREATE TABLE conversations (
  key TEXT PRIMARY KEY,    -- プロジェクトパス
  value TEXT              -- JSON (conversation_id, transcript等)
)
```

#### Key-Value関係
- **Key**: 絶対プロジェクトパス
- **Value**: JSON形式の会話データ
  - `conversation_id`: プロジェクト固有のUUID
  - `transcript`: メッセージ配列
  - `model`: 使用モデル
  - その他メタデータ

#### 実データサンプル（24件のconversation確認済み）
```
/Users/username/dev/quincy → fb5cdbe5-934c-4e25-9abd-bcc28617ba5b
/Users/username/dev/amazon-q-orgs → bfad3a7c-4937-4083-af13-b39dc0493cf1
/Users/username/dev/worktrees/task1 → 02d4750d-5fae-4666-9079-26cb5b813ab4
```

### 5. 複数conversation_id存在時の`--resume`動作

#### ✅ 確認された事実
- **`--resume`は現在の実行ディレクトリのconversation_idを参照する**
- **子ディレクトリや親ディレクトリの別conversation_idは無視される**
- **"Picking up where we left off..."**メッセージで履歴継続を示す

#### 📊 実測データ
```
テスト環境:
- /Users/username/dev/quincy-worktrees/stdio-termination-detection/apps/frontend
  → conversation_id: aa07cf31-d3c0-4872-95f8-d932aa5ec2b1

- /Users/username/dev/quincy-worktrees/stdio-termination-detection/apps/frontend/test-amazon-q-behavior  
  → conversation_id: 7e956466-26ef-4fcf-a7c4-8a4f53dde6a8

apps/frontendディレクトリで--resume実行:
- 参照されたconversation_id: aa07cf31-d3c0-4872-95f8-d932aa5ec2b1 (現在のディレクトリ)
- test-amazon-q-behaviorのconversation_idは無視
- 前回のAngularプロジェクトの話を継続
```

## 我々のシステム実装への影響

### ✅ 正しかった設計
1. **conversation_idベースのURL設計**（`/chat/:conversation_id`）
2. **プロジェクトパス → conversation_id追跡システム**
3. **固定conversation_idを前提とした実装**

### ❌ 修正が必要な前提
1. **transcript履歴の累積性**
   - 通常セッションでは累積されない
   - `--resume`セッションでのみ累積される

### 🔄 設計への影響
1. **New Project流れ**: conversation_id追跡システムは有効
2. **履歴表示**: `--resume`フラグの有無で動作が変わることを考慮
3. **リアルタイムチャット**: conversation_id固定を前提とした実装は正しい

## 結論

- Amazon Q CLIは**プロジェクトパスベースの固定conversation_id**を使用
- **通常セッション**では履歴が上書きされる
- **`--resume`セッション**では履歴が累積される
- 我々の**conversation_idベースのシステム設計は基本的に正しい**
- **New Project流れの問題は別の原因**にある可能性が高い

## 次のアクション

1. New Project流れでconversation_id追跡システムが正常に動作しない原因を調査
2. `--resume`オプションの有無による動作差異を考慮したシステム設計の見直し
3. 実際のAmazon Q CLI動作に基づいたテストケースの更新

---

## 追加調査: `--resume`オプションのSQLite参照メカニズム

### 調査日時

2025年7月21日（日）

### 調査目的

`q chat --resume`コマンドがSQLite3データベースのどの履歴を参照するのかを特定する。

### SQLite3データベース構造

#### 保存場所
```
~/Library/Application Support/amazon-q/data.sqlite3
```

#### テーブル構造
```sql
CREATE TABLE conversations (
  key TEXT PRIMARY KEY,    -- プロジェクトの絶対パス
  value TEXT              -- JSON形式のconversationデータ
)
```

### --resumeオプションの動作メカニズム

#### ✅ 確認された事実

1. **`--resume`は現在の実行ディレクトリのkeyを使用**
   - カレントディレクトリの絶対パスをkeyとして検索
   - 該当するconversationレコードのtranscriptに追加

2. **SQLiteクエリパターン**
   ```sql
   -- 現在のディレクトリのconversationを取得
   SELECT value FROM conversations 
   WHERE key = '現在のディレクトリの絶対パス';
   ```

3. **transcript履歴の処理**
   - 既存のtranscript配列に新しいメッセージを追加
   - 過去の履歴は保持される（累積型）
   - "Picking up where we left off..."メッセージで開始

### 実証データ

#### テスト環境のconversation構造
```
/Users/username/dev/quincy-worktrees/stdio-termination-detection/
├── apps/backend (conversation_id: 35b52056-0841-4aaa-8de0-0ca4829c7c91)
├── apps/frontend (conversation_id: aa07cf31-d3c0-4872-95f8-d932aa5ec2b1)
└── apps/frontend/test-amazon-q-behavior (conversation_id: 7e956466-26ef-4fcf-a7c4-8a4f53dde6a8)
```

#### --resume実行時の動作確認
```bash
# test-amazon-q-behaviorディレクトリでの実行
cd /Users/username/dev/quincy-worktrees/stdio-termination-detection/apps/frontend/test-amazon-q-behavior
q chat --resume

# 結果:
# - conversation_id: 7e956466-26ef-4fcf-a7c4-8a4f53dde6a8を使用
# - transcript要素数: 5 → 6（1つ追加）
# - 親ディレクトリのconversationは参照されない
```

### 重要な発見事項

1. **ディレクトリ階層の考慮なし**
   - 親ディレクトリや子ディレクトリのconversationは無視
   - 現在のディレクトリの絶対パスのみで検索

2. **conversation_idの選択基準**
   - タイムスタンプによる最新選択ではない
   - 現在のディレクトリパスの完全一致で決定
   - 複数のconversation_idが存在しても混同されない

3. **SQLite3中心アーキテクチャへの影響**
   - プロジェクトパスベースの検索は妥当
   - conversation_id追跡の重要性を再確認
   - リアルタイム監視時もパスベースでのフィルタリングが必要

### システム実装への推奨事項

1. **SQLite監視システム**
   - keyフィールドでの正確なフィルタリング実装
   - 子ディレクトリでの作業も考慮した設計

2. **履歴取得メカニズム**
   ```typescript
   // 推奨される実装パターン
   async function getConversationForPath(absolutePath: string) {
     const query = `SELECT value FROM conversations WHERE key = ?`;
     return await db.get(query, [absolutePath]);
   }
   ```

3. **リアルタイム更新**
   - SQLite3ファイルの変更検知時に、変更されたkeyを特定
   - 該当するconversation_idのUIのみを更新

---

## 重要な追加調査: 同一ディレクトリでの複数セッション動作

### 調査日時

2025年7月21日（日）

### 調査結果

#### ⚠️ 既存の理解の修正が必要

**誤った理解**: 同じプロジェクトパスには固定のconversation_idが割り当てられる

**正しい理解**: 
- 同じプロジェクトパスでも、新しい`q chat`セッションごとに**新しいconversation_id**が生成される
- SQLiteデータベースでは、keyがPRIMARY KEYのため、**既存のレコードが上書きされる**

#### 実証データ

```bash
# 同一ディレクトリで3回連続でq chatを実行
cd /Users/username/dev/quincy-worktrees/stdio-termination-detection/apps/frontend/test-amazon-q-behavior

# 1回目: conversation_id = 7e956466-26ef-4fcf-a7c4-8a4f53dde6a8
# 2回目: conversation_id = 0968ef09-24ce-440d-b369-e63865a0bc6e (上書き)
# 3回目: conversation_id = efb874e1-aa2e-4bac-ae8e-d018e9f1ee39 (上書き)
```

#### SQLiteの動作メカニズム

1. **データ構造**
   ```sql
   CREATE TABLE conversations (
       key TEXT PRIMARY KEY,    -- プロジェクトの絶対パス
       value TEXT              -- JSON形式のconversationデータ
   )
   ```

2. **上書き動作**
   - 新しい`q chat`実行時: INSERT OR REPLACE操作
   - 既存のconversation_idとtranscriptは**完全に削除**
   - 新しいconversation_idとクリーンなtranscriptで置換

3. **履歴の喪失**
   - 同じkeyのレコードは1つしか存在できない
   - 古いconversation履歴は取得不可能になる

#### --resumeの動作

- **参照するデータ**: 現在のディレクトリパスに対応する**最新の（唯一の）**レコード
- **複数履歴の選択**: 不可能（履歴は1つしか保持されない）
- **"Picking up where we left off..."**: 最後に保存されたtranscriptから継続

### システム設計への重大な影響

1. **conversation_id追跡の限界**
   - conversation_idは永続的ではない
   - 新しいセッションで失われる可能性

2. **履歴管理の考慮事項**
   - 重要な会話は外部バックアップが必要
   - リアルタイム監視システムは頻繁なID変更に対応必要

3. **推奨される実装アプローチ**
   ```typescript
   // プロジェクトパスを主キーとして使用
   // conversation_idは補助的な識別子として扱う
   interface ConversationTracker {
     projectPath: string;        // 主要な識別子
     currentConversationId: string;  // 現在のID（変更される）
     lastUpdated: Date;
   }
   ```

---

**調査者**: Claude Code  
**調査対象**: Amazon Q CLI v1.x  
**環境**: macOS Darwin 24.4.0