# stdio streams による確実なAmazon Q CLI終了検出プラン

## 概要
現在のプロセス終了検出は`exit`イベントのみに依存しており、stdio streams（stdin/stdout/stderr）が完全に閉じる前に処理完了と判断してしまう問題があります。システムレベルでの確実な終了検出を実装し、データロスや不完全な終了通知を防ぎます。

## 実装タスク

### Phase 1: 新しい終了検出システムの構築

- [ ] **Task 1.1**: `enhanced-process-termination.ts` モジュールを作成
  - プロセス`exit`イベント監視
  - プロセス`close`イベント監視
  - stdio streams個別監視（`stdout.on('end')`, `stderr.on('end')`, `stdin.on('finish')`）
  - 段階的終了状態の定義と管理

- [ ] **Task 1.2**: 終了状態管理システムの実装
  - `process-running` → `process-exited` → `streams-closing` → `fully-terminated`
  - 各状態の管理ロジック
  - 状態遷移の検証機能

- [ ] **Task 1.3**: バッファフラッシュの確実性向上
  - ストリーム終了前の残存データ処理
  - 最後の出力データの確実な取得
  - タイムアウト機能によるハング防止

### Phase 2: 既存システムとの統合

- [ ] **Task 2.1**: `setup-process-handlers.ts` の段階的移行
  - 既存の終了処理ロジックの分析
  - 新しい検出システムとの統合ポイント特定
  - 後方互換性の確保

- [ ] **Task 2.2**: WebSocketイベントのタイミング最適化
  - `q:complete`イベントの送信タイミング調整
  - 段階的終了通知の実装（`q:process-exited`, `q:fully-terminated`）
  - クライアント側での終了状態表示改善

- [ ] **Task 2.3**: セッションクリーンアップの改善
  - 既存の10秒遅延ロジックとの整合性確保
  - リソース解放のタイミング最適化
  - メモリリークの防止

### Phase 3: テストとバリデーション

- [ ] **Task 3.1**: 終了検出の単体テスト作成
  - 各stdio streamの終了イベントテスト
  - 段階的終了状態のテスト
  - タイムアウト機能のテスト

- [ ] **Task 3.2**: 統合テストの実装
  - Amazon Q CLI実行終了シナリオのテスト
  - 強制終了、正常終了の各パターン
  - バッファフラッシュの確実性検証

- [ ] **Task 3.3**: パフォーマンステスト
  - 検出遅延の測定
  - リソース使用量の監視
  - 既存実装との比較

### Phase 4: ドキュメントと保守性

- [ ] **Task 4.1**: 技術ドキュメントの作成
  - stdio streams監視の仕組み説明
  - 段階的終了状態の詳細
  - トラブルシューティングガイド

- [ ] **Task 4.2**: コードコメントとJSDocの追加
  - 各関数の詳細な説明
  - 使用例とベストプラクティス
  - エラーハンドリングの説明

## 技術的詳細

### stdio streams 監視の利点
- **確実性**: システムレベルの検出でfalse positiveなし
- **言語非依存**: Amazon Q CLIの出力言語に関係なく動作
- **リアルタイム**: パターンマッチングより高速で確実

### 実装予定ファイル
```
apps/backend/src/services/amazon-q-cli/process-manager/
├── enhanced-process-termination.ts     # 新しい終了検出システム
├── termination-state-manager.ts        # 終了状態管理
└── stdio-monitor.ts                    # streams個別監視

apps/backend/src/tests/services/amazon-q-cli/process-manager/
├── enhanced-process-termination.test.ts
├── termination-state-manager.test.ts
└── stdio-monitor.test.ts
```

### 期待される効果
1. **データロス防止**: 最後の出力まで確実に取得
2. **正確な終了通知**: クライアントへの適切なタイミングでの通知
3. **リソース効率**: 不要な遅延の削減
4. **安定性向上**: プロセス終了処理の信頼性向上

## 成功指標
- [ ] 全stdio streams終了の100%検出達成
- [ ] データロス発生率0%
- [ ] 終了検出遅延を現在の1/2以下に短縮
- [ ] 既存機能の完全な後方互換性維持