# フロントエンド開発ガイド

## 目次

1. [セットアップ](#セットアップ)
2. [プロジェクト構造](#プロジェクト構造)
3. [コンポーネント作成](#コンポーネント作成)
4. [状態管理](#状態管理)
5. [サービス作成](#サービス作成)
6. [テスト作成](#テスト作成)
7. [ベストプラクティス](#ベストプラクティス)

## セットアップ

### 前提条件

- Node.js (v20以上)
- pnpm
- Angular CLI

### 環境構築

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev:frontend

# ビルド
pnpm build:frontend

# テスト実行
pnpm test
```

## プロジェクト構造

```
apps/frontend/src/app/
├── core/                    # コア機能
│   ├── services/           # コアサービス
│   ├── store/              # 状態管理
│   └── types/              # コア型定義
├── features/               # 機能別モジュール
│   ├── chat/               # チャット機能
│   ├── project/            # プロジェクト管理
│   └── history/            # 履歴表示
├── shared/                 # 共有モジュール
│   ├── components/         # 再利用可能コンポーネント
│   ├── utils/              # ユーティリティ関数
│   └── types/              # 共有型定義
└── layouts/                # レイアウトコンポーネント
```

## コンポーネント作成

### 基本的なコンポーネント構造

```typescript
import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-example',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="example-component">
      <h2>{{ title() }}</h2>
      <button (click)="handleClick()">Click me</button>
    </div>
  `
})
export class ExampleComponent {
  // Input properties
  title = input.required<string>();
  
  // Output events
  clicked = output<void>();
  
  // Internal state
  private count = signal(0);
  
  handleClick(): void {
    this.count.update(c => c + 1);
    this.clicked.emit();
  }
}
```

### コンポーネントの分離

大きなコンポーネントは、1ファイル1関数の原則に従って分離します：

```typescript
// 分離前
@Component({
  // 大きなコンポーネント
})
export class LargeComponent {
  validateData() { /* ... */ }
  formatData() { /* ... */ }
  sendData() { /* ... */ }
}

// 分離後
// components/large/large.component.ts
@Component({
  // コンテナーコンポーネント
})
export class LargeComponent {
  // 分離されたサービスを使用
}

// components/large/services/data-validator.ts
export function validateData(data: any): boolean {
  // バリデーションロジック
}

// components/large/services/data-formatter.ts
export function formatData(data: any): FormattedData {
  // フォーマットロジック
}
```

## 状態管理

### 基本的な状態管理

```typescript
// state/example.state.ts
import { signal, computed } from '@angular/core';

export interface ExampleState {
  items: Item[];
  loading: boolean;
  error: string | null;
}

export const exampleState = signal<ExampleState>({
  items: [],
  loading: false,
  error: null
});

// Computed values
export const itemCount = computed(() => exampleState().items.length);
export const hasItems = computed(() => itemCount() > 0);
```

### アクションの作成

```typescript
// state/actions/add-item.ts
import { exampleState } from '../example.state';

export function addItem(item: Item): void {
  exampleState.update(state => ({
    ...state,
    items: [...state.items, item]
  }));
}
```

### セレクターの作成

```typescript
// state/selectors/get-items.ts
import { exampleState } from '../example.state';

export function getItems() {
  return exampleState().items;
}

export function getItemById(id: string) {
  return exampleState().items.find(item => item.id === id);
}
```

## サービス作成

### 基本的なサービス

```typescript
// services/example.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExampleService {
  constructor(private http: HttpClient) {}

  getData(): Observable<Data[]> {
    return this.http.get<Data[]>('/api/data');
  }
}
```

### サービスの分離

```typescript
// services/example/get-data.ts
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export function getData(http: HttpClient): Observable<Data[]> {
  return http.get<Data[]>('/api/data');
}

// services/example/process-data.ts
export function processData(data: Data[]): ProcessedData[] {
  return data.map(item => ({
    ...item,
    processed: true
  }));
}
```

## テスト作成

### コンポーネントテスト

```typescript
// example.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExampleComponent } from './example.component';

describe('ExampleComponent', () => {
  let component: ExampleComponent;
  let fixture: ComponentFixture<ExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExampleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ExampleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit clicked event', () => {
    spyOn(component.clicked, 'emit');
    component.handleClick();
    expect(component.clicked.emit).toHaveBeenCalled();
  });
});
```

### 関数テスト

```typescript
// validators/path-validator.spec.ts
import { validatePath } from './path-validator';

describe('validatePath', () => {
  it('should return null for valid path', () => {
    const result = validatePath('/valid/path');
    expect(result).toBeNull();
  });

  it('should return error for empty path', () => {
    const result = validatePath('');
    expect(result).toBe('パスを入力してください');
  });
});
```

### サービステスト

```typescript
// services/example.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ExampleService } from './example.service';

describe('ExampleService', () => {
  let service: ExampleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ExampleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch data', () => {
    const mockData = [{ id: 1, name: 'Test' }];

    service.getData().subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne('/api/data');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });
});
```

## ベストプラクティス

### 1. TypeScript

```typescript
// Good: 厳密な型定義
interface User {
  id: string;
  name: string;
  email: string;
}

function processUser(user: User): string {
  return `${user.name} (${user.email})`;
}

// Bad: any型の使用
function processUser(user: any): string {
  return `${user.name} (${user.email})`;
}
```

### 2. Signals

```typescript
// Good: Signalsの使用
const count = signal(0);
const doubleCount = computed(() => count() * 2);

// Bad: 従来のプロパティ
let count = 0;
get doubleCount() {
  return this.count * 2;
}
```

### 3. OnPush戦略

```typescript
// Good: OnPush戦略の使用
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class OptimizedComponent {
  // Signalsを使用した状態管理
  data = signal<Data[]>([]);
}
```

### 4. 純粋関数

```typescript
// Good: 純粋関数
export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

// Bad: 副作用のある関数
export function formatDate(date: Date): string {
  console.log('Formatting date:', date); // 副作用
  return date.toLocaleDateString();
}
```

### 5. エラーハンドリング

```typescript
// Good: 適切なエラーハンドリング
export function validateInput(input: string): string | null {
  if (!input.trim()) {
    return 'Input is required';
  }
  
  if (input.length < 3) {
    return 'Input must be at least 3 characters';
  }
  
  return null;
}

// Bad: エラーハンドリングなし
export function validateInput(input: string): boolean {
  return input.trim().length >= 3;
}
```

### 6. 命名規則

```typescript
// Good: 意味のある名前
export function calculateTotalPrice(items: Item[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}

// Bad: 不明確な名前
export function calc(items: any[]): number {
  return items.reduce((t, i) => t + i.p, 0);
}
```

## パフォーマンス最適化

### 1. Lazy Loading

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'chat',
    loadComponent: () => import('./features/chat/chat.component').then(c => c.ChatComponent)
  }
];
```

### 2. Track By Functions

```typescript
// Good: trackBy関数の使用
@Component({
  template: `
    @for (item of items; track item.id) {
      <div>{{ item.name }}</div>
    }
  `
})
export class ListComponent {
  items = signal<Item[]>([]);
}
```

### 3. Computed Values

```typescript
// Good: 計算値のキャッシュ
export class DataComponent {
  private data = signal<Data[]>([]);
  
  // 計算値は自動的にキャッシュされる
  processedData = computed(() => {
    return this.data().map(item => processItem(item));
  });
}
```

## デバッグ

### 1. Angular DevTools

```typescript
// デバッグ用のログ
export function debugLog(message: string, data?: any): void {
  if (!environment.production) {
    console.log(`[DEBUG] ${message}`, data);
  }
}
```

### 2. エラー境界

```typescript
// エラーハンドリングコンポーネント
@Component({
  template: `
    @if (error()) {
      <div class="error-boundary">
        <h2>Something went wrong</h2>
        <p>{{ error() }}</p>
        <button (click)="retry()">Retry</button>
      </div>
    } @else {
      <ng-content></ng-content>
    }
  `
})
export class ErrorBoundaryComponent {
  error = signal<string | null>(null);
  
  retry(): void {
    this.error.set(null);
    // リトライロジック
  }
}
```

## まとめ

このガイドに従うことで、以下の利点が得られます：

1. **保守性**: 1ファイル1関数により、コードの理解と修正が容易
2. **テスト性**: 独立した関数により、テストが簡単
3. **再利用性**: 純粋な関数により、再利用が可能
4. **型安全性**: TypeScriptの厳密な型チェック
5. **パフォーマンス**: Angularのベストプラクティスに従った最適化

継続的な学習と改善により、より良いフロントエンドアプリケーションを構築できます。