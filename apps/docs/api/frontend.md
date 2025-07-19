# Frontend Components

QuincyのフロントエンドはAngular 20で構築されており、standalone componentsとsignalsを使用しています。

## 主要コンポーネント

### Layout Component

アプリケーション全体のレイアウトを管理するメインコンポーネントです。

```typescript
import { LayoutComponent } from '@/shared/components/layout/layout.component';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent],
  template: `<app-layout />`,
})
export class AppComponent {}
```

### Navigation Component

サイドバーのナビゲーションを提供します。

**使用例:**

```typescript
import { NavigationComponent } from '@/shared/components/navigation/navigation.component';

@Component({
  imports: [NavigationComponent],
  template: `<app-navigation />`,
})
export class SidebarComponent {}
```

### Chat Component

リアルタイムチャット機能を提供します。

**主な機能:**

- メッセージの送受信
- 入力状態の表示
- メッセージ履歴の表示

```typescript
import { ChatComponent } from '@/features/chat/chat.component';

@Component({
  imports: [ChatComponent],
  template: `<app-chat />`,
})
export class MainComponent {}
```

### Projects Component

プロジェクト管理機能を提供します。

**主な機能:**

- プロジェクト一覧の表示
- プロジェクトの作成・削除
- アクティブプロジェクトの切り替え

```typescript
import { ProjectsComponent } from '@/features/projects/projects.component';

@Component({
  imports: [ProjectsComponent],
  template: `<app-projects />`,
})
export class DashboardComponent {}
```

## 共有コンポーネント

### Message Input

メッセージ入力フィールドを提供する再利用可能なコンポーネントです。

**Props:**

- `placeholder`: string - プレースホルダーテキスト
- `disabled`: boolean - 無効状態

**Events:**

- `messageSubmit`: EventEmitter&lt;string&gt; - メッセージ送信イベント
- `typing`: EventEmitter&lt;boolean&gt; - 入力状態変更イベント

```typescript
import { MessageInputComponent } from '@/shared/components/message-input/message-input.component';

@Component({
  imports: [MessageInputComponent],
  template: `
    <app-message-input
      placeholder="メッセージを入力..."
      (messageSubmit)="onMessageSubmit($event)"
      (typing)="onTyping($event)"
    />
  `,
})
export class ChatContainerComponent {
  onMessageSubmit(message: string) {
    console.log('Message:', message);
  }

  onTyping(isTyping: boolean) {
    console.log('Typing:', isTyping);
  }
}
```

### Message List

メッセージリストを表示するコンポーネントです。

**Props:**

- `messages`: Message[] - 表示するメッセージ配列

```typescript
import { MessageListComponent } from '@/shared/components/message-list/message-list.component';

@Component({
  imports: [MessageListComponent],
  template: `
    <app-message-list [messages]="messages()" />
  `
})
export class ChatDisplayComponent {
  messages = signal&lt;Message[]&gt;([]);
}
```

### Project List

プロジェクト一覧を表示するコンポーネントです。

**Props:**

- `projects`: Project[] - プロジェクト配列
- `activeProjectId`: string - アクティブなプロジェクトID

**Events:**

- `projectSelect`: EventEmitter&lt;string&gt; - プロジェクト選択イベント

```typescript
import { ProjectListComponent } from '@/shared/components/project-list/project-list.component';

@Component({
  imports: [ProjectListComponent],
  template: `
    <app-project-list
      [projects]="projects()"
      [activeProjectId]="activeProjectId()"
      (projectSelect)="onProjectSelect($event)"
    />
  `
})
export class ProjectManagerComponent {
  projects = signal&lt;Project[]&gt;([]);
  activeProjectId = signal&lt;string&gt;('');

  onProjectSelect(projectId: string) {
    this.activeProjectId.set(projectId);
  }
}
```

## サービス

### API Service

バックエンドAPIとの通信を担当するサービスです。

```typescript
import { ApiService } from '@/core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private api: ApiService) {}

  getProjects() {
    return this.api.get&lt;Project[]&gt;('/api/projects');
  }

  createProject(project: CreateProjectRequest) {
    return this.api.post&lt;Project&gt;('/api/projects', project);
  }
}
```

### WebSocket Service

リアルタイム通信を管理するサービスです。

```typescript
import { WebSocketService } from '@/core/services/websocket.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private ws: WebSocketService) {}

  sendMessage(message: string) {
    this.ws.send({
      type: 'chat_message',
      data: { content: message },
    });
  }

  onMessage() {
    return this.ws.messages$.pipe(filter(msg => msg.type === 'chat_message'));
  }
}
```

## 状態管理

### App State

アプリケーション全体の状態を管理するストアです。

```typescript
import { AppState } from '@/core/store/app.state';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private state = signal&lt;AppState&gt;({
    user: null,
    activeProject: null,
    isConnected: false
  });

  readonly user = computed(() => this.state().user);
  readonly activeProject = computed(() => this.state().activeProject);
  readonly isConnected = computed(() => this.state().isConnected);

  setUser(user: User) {
    this.state.update(state => ({ ...state, user }));
  }

  setActiveProject(project: Project) {
    this.state.update(state => ({ ...state, activeProject: project }));
  }
}
```

## スタイリング

フロントエンドは標準のCSSを使用しており、コンポーネント固有のスタイルは各コンポーネントファイル内で定義されています。

```typescript
@Component({
  selector: 'app-example',
  template: `<div class="container">Content</div>`,
  styles: [
    `
      .container {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #f5f5f5;
      }
    `,
  ],
})
export class ExampleComponent {}
```
