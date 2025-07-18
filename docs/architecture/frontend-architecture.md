# フロントエンドアーキテクチャ

## 概要

このドキュメントは、フロントエンドアプリケーションのアーキテクチャについて説明します。アプリケーションは1ファイル1関数の原則に従って設計されており、モジュラーで保守性の高い構造となっています。

## アーキテクチャ図

```mermaid
graph TB
    subgraph "Frontend Architecture"
        subgraph "Features"
            F1[Chat Component]
            F2[Project List Component]
            F3[History Component]
        end
        
        subgraph "Shared Components"
            SC1[Message List]
            SC2[Path Selector]
            SC3[Message Input]
        end
        
        subgraph "Core Services"
            CS1[WebSocket Service]
            CS2[State Management]
            CS3[Type Definitions]
        end
        
        subgraph "Utilities"
            U1[Validators]
            U2[Formatters]
            U3[Converters]
            U4[Generators]
        end
        
        F1 --> SC1
        F1 --> SC2
        F1 --> SC3
        F1 --> CS1
        F1 --> CS2
        
        SC1 --> CS2
        SC2 --> CS1
        SC3 --> CS1
        
        CS1 --> U1
        CS1 --> U2
        CS2 --> U3
        CS2 --> U4
        
        CS1 --> CS3
        CS2 --> CS3
    end
```

## コンポーネント階層

```mermaid
graph TD
    App[App Component]
    
    App --> Layout[Layout Component]
    Layout --> Sidebar[Sidebar Component]
    Layout --> Main[Main Content]
    
    Main --> Chat[Chat Component]
    Main --> ProjectList[Project List Component]
    Main --> History[History Component]
    
    Chat --> ChatHeader[Chat Header]
    Chat --> ChatMessages[Chat Messages]
    Chat --> SessionStart[Session Start]
    Chat --> ChatError[Chat Error]
    Chat --> EmptyState[Empty State]
    
    ChatMessages --> MessageList[Message List]
    ChatMessages --> MessageInput[Message Input]
    
    Main --> PathSelector[Path Selector]
```

## データフロー

```mermaid
graph LR
    subgraph "User Interface"
        UI[Components]
    end
    
    subgraph "State Management"
        Store[App Store]
        ProjectStore[Project Store]
        SessionStore[Session Store]
        ChatStore[Chat Store]
        HistoryStore[History Store]
    end
    
    subgraph "Services"
        WS[WebSocket Service]
        API[API Service]
    end
    
    subgraph "Backend"
        Server[Backend Server]
        CLI[Amazon Q CLI]
    end
    
    UI --> Store
    Store --> ProjectStore
    Store --> SessionStore
    Store --> ChatStore
    Store --> HistoryStore
    
    Store --> WS
    WS --> API
    API --> Server
    Server --> CLI
    
    CLI --> Server
    Server --> API
    API --> WS
    WS --> Store
    Store --> UI
```

## 状態管理フロー

```mermaid
graph TD
    subgraph "State Management Flow"
        Action[Action]
        Reducer[Reducer Function]
        State[State Update]
        Component[Component Update]
        
        Action --> Reducer
        Reducer --> State
        State --> Component
        Component --> Action
    end
    
    subgraph "Store Structure"
        AppStore[App Store]
        
        AppStore --> ProjectState[Project State]
        AppStore --> SessionState[Session State]
        AppStore --> ChatState[Chat State]
        AppStore --> HistoryState[History State]
        
        ProjectState --> ProjectActions[Project Actions]
        ProjectState --> ProjectSelectors[Project Selectors]
        
        SessionState --> SessionActions[Session Actions]
        SessionState --> SessionSelectors[Session Selectors]
        
        ChatState --> ChatActions[Chat Actions]
        ChatState --> ChatSelectors[Chat Selectors]
        
        HistoryState --> HistoryActions[History Actions]
        HistoryState --> HistorySelectors[History Selectors]
    end
```

## モジュール構造

### Core Modules

- **Services**: アプリケーションのコアロジック
- **Store**: 状態管理
- **Types**: 型定義

### Feature Modules

- **Chat**: チャット機能
- **Project**: プロジェクト管理
- **History**: 履歴表示

### Shared Modules

- **Components**: 再利用可能なコンポーネント
- **Utils**: ユーティリティ関数
- **Types**: 共有型定義

## 1ファイル1関数の原則

### 原則

1. **Single Responsibility**: 各ファイルは単一の責任を持つ
2. **Pure Functions**: 副作用のない純粋な関数
3. **Testability**: 独立してテスト可能
4. **Reusability**: 再利用しやすい設計

### 例

```typescript
// Bad: 複数の責任を持つファイル
export class UserService {
  validateUser(user: User): boolean { /* ... */ }
  formatUserName(user: User): string { /* ... */ }
  saveUser(user: User): void { /* ... */ }
}

// Good: 単一の責任を持つファイル
// validate-user.ts
export function validateUser(user: User): boolean { /* ... */ }

// format-user-name.ts
export function formatUserName(user: User): string { /* ... */ }

// save-user.ts
export function saveUser(user: User): void { /* ... */ }
```

## 型安全性

### 型定義の階層

1. **Common Types**: 基本的な型定義
2. **Domain Types**: ドメイン固有の型
3. **UI Types**: UI関連の型
4. **Service Types**: サービス固有の型

### 型ガード

```typescript
// 型ガード関数の例
export function isValidMessage(data: unknown): data is Message {
  return typeof data === 'object' && 
         data !== null && 
         'id' in data && 
         'content' in data;
}
```

## パフォーマンス最適化

### 戦略

1. **Lazy Loading**: 必要な時にのみコンポーネントをロード
2. **OnPush Strategy**: 変更検知戦略の最適化
3. **Signals**: Angularの新しいリアクティブプリミティブ
4. **Tree Shaking**: 不要なコードの除去

### 実装例

```typescript
@Component({
  selector: 'app-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class ChatComponent {
  // Signals for reactive state
  messages = signal<Message[]>([]);
  
  // Computed values
  messageCount = computed(() => this.messages().length);
}
```

## テスト戦略

### テストの種類

1. **Unit Tests**: 個別の関数・コンポーネントのテスト
2. **Integration Tests**: モジュール間の連携テスト
3. **E2E Tests**: エンドツーエンドのテスト

### テスト構造

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── websocket.service.ts
│   │   │   └── websocket.service.spec.ts
│   │   └── store/
│   │       ├── app.state.ts
│   │       └── app.state.spec.ts
│   └── shared/
│       ├── utils/
│       │   ├── validators/
│       │   │   ├── path-validator.ts
│       │   │   └── path-validator.spec.ts
│       │   └── formatters/
│       │       ├── date-formatter.ts
│       │       └── date-formatter.spec.ts
```

## 開発ガイドライン

### コーディング規約

1. **TypeScript Strict Mode**: 厳密な型チェック
2. **ESLint**: コード品質の確保
3. **Prettier**: コードフォーマット
4. **Conventional Commits**: コミットメッセージの統一

### コードレビュー

1. **Type Safety**: 型安全性の確認
2. **Test Coverage**: テストカバレッジの確認
3. **Performance**: パフォーマンスの確認
4. **Architecture**: アーキテクチャの一貫性確認

## デプロイメント

### ビルド戦略

1. **Production Build**: 本番環境用の最適化ビルド
2. **Bundle Analysis**: バンドルサイズの分析
3. **Tree Shaking**: 不要コードの除去
4. **Minification**: コードの最小化

### 環境設定

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  websocketUrl: 'ws://localhost:3000'
};
```

## まとめ

このアーキテクチャにより、以下の利点が得られます：

1. **保守性**: 1ファイル1関数により、コードの理解と修正が容易
2. **拡張性**: モジュラー設計により、新機能の追加が簡単
3. **テスト性**: 独立した関数により、テストが容易
4. **再利用性**: 純粋な関数により、再利用が可能
5. **型安全性**: TypeScriptの型システムによる安全性

このアーキテクチャは、現代的なフロントエンド開発のベストプラクティスに基づいており、スケーラブルで保守性の高いアプリケーションを構築できます。