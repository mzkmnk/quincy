# プロジェクト構造・組織

## モノレポレイアウト
プロジェクトは関心の分離を明確にしたpnpm workspaceモノレポ構造に従います：

```
quincy/
├── apps/                    # アプリケーションパッケージ
│   ├── backend/            # Express.js APIサーバー
│   ├── frontend/           # Angular Webアプリケーション
│   └── docs/               # VitePressドキュメント
├── packages/               # 共有パッケージ
│   └── shared/             # 共通型定義・ユーティリティ
└── docs/                   # アーキテクチャドキュメント
```

## バックエンド構造 (`apps/backend/`)
```
src/
├── index.ts                # アプリケーションエントリーポイント
├── routes/                 # APIルートハンドラー
├── services/               # ビジネスロジック・統合機能
│   ├── amazon-q-*.ts      # Amazon Q CLI統合
│   ├── websocket.ts       # WebSocketサーバーロジック
│   └── health.ts          # ヘルスチェックサービス
├── tests/                  # ユニット・統合テスト
└── utils/                  # 共有ユーティリティ
    ├── errors.ts          # エラーハンドリング
    └── logger.ts          # ログユーティリティ
```

## フロントエンド構造 (`apps/frontend/`)
```
src/app/
├── core/                   # コアアプリケーションサービス
│   ├── services/          # HTTP・WebSocketサービス
│   └── store/             # アプリケーション状態管理
├── features/              # 機能固有モジュール
│   └── chat/              # チャット機能
├── shared/                # 再利用可能コンポーネント
│   └── components/        # UIコンポーネント
│       ├── amazon-q-message/
│       ├── message-input/
│       ├── message-list/
│       ├── navigation/
│       ├── path-selector/
│       ├── project-list/
│       ├── sidebar/
│       ├── typing-indicator/
│       └── user-message/
└── app.ts                 # ルートコンポーネント
```

## 共有パッケージ (`packages/shared/`)
```
src/
├── index.ts               # メインエクスポート
└── types/                 # TypeScript型定義
    ├── project.ts         # プロジェクト関連型
    ├── session.ts         # セッション管理型
    └── websocket.ts       # WebSocketメッセージ型
```

## ドキュメント構造
- `docs/architecture/` - 技術アーキテクチャドキュメント
- `docs/diagrams/` - システム図・視覚的ドキュメント
- `apps/docs/` - VitePressドキュメントサイト

## ファイル命名規則
- **バックエンド**: ファイルはkebab-case（例：`amazon-q-cli.ts`）
- **フロントエンド**: コンポーネントファイルはkebab-case、クラスはPascalCase
- **型定義**: ドメイン概念に合致する説明的な名前
- **テスト**: テストファイルは`*.test.ts`サフィックス

## インポート・エクスポートパターン
- 全体でESモジュール（`import`/`export`）を使用
- 共有型は`@quincy/shared`パッケージからエクスポート
- ローカルモジュールは相対インポート、外部パッケージは絶対インポート
- クリーンなインポートのためindexファイルでバレルエクスポート

## 設定ファイル
- ルート`package.json`でワークスペーススクリプト定義
- 各アプリ・パッケージに個別の`package.json`
- `pnpm-workspace.yaml`でワークスペース構造定義
- TypeScript設定はベース設定から継承