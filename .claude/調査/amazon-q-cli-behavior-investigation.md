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
プロジェクトパス: /Users/mzkmnk/dev/quincy-worktrees/stdio-termination-detection/apps/frontend/test-amazon-q-behavior
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
/Users/mzkmnk/dev/quincy → fb5cdbe5-934c-4e25-9abd-bcc28617ba5b
/Users/mzkmnk/dev/amazon-q-orgs → bfad3a7c-4937-4083-af13-b39dc0493cf1
/Users/mzkmnk/dev/worktrees/task1 → 02d4750d-5fae-4666-9079-26cb5b813ab4
```

### 5. 複数conversation_id存在時の`--resume`動作

#### ✅ 確認された事実
- **`--resume`は現在の実行ディレクトリのconversation_idを参照する**
- **子ディレクトリや親ディレクトリの別conversation_idは無視される**
- **"Picking up where we left off..."**メッセージで履歴継続を示す

#### 📊 実測データ
```
テスト環境:
- /Users/mzkmnk/dev/quincy-worktrees/stdio-termination-detection/apps/frontend
  → conversation_id: aa07cf31-d3c0-4872-95f8-d932aa5ec2b1

- /Users/mzkmnk/dev/quincy-worktrees/stdio-termination-detection/apps/frontend/test-amazon-q-behavior  
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

**調査者**: Claude Code  
**調査対象**: Amazon Q CLI v1.x  
**環境**: macOS Darwin 24.4.0