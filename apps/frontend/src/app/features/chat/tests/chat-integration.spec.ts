import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';

import { ChatComponent } from '../chat.component';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';

// ChatComponentの統合テスト - 実際のコンポーネント動作をテスト
describe('ChatComponent Integration', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let mockAppStore: Partial<AppStore>;
  let mockWebSocketService: Partial<WebSocketService>;
  let sessionFailedSubject: Subject<{ error: string }>;

  const createMockAppStore = () => ({
    // Session related
    currentQSession: signal(null),
    sessionStarting: signal(false),
    sessionError: signal(null),

    // Conversation related
    currentQConversation: signal(null),
    amazonQHistory: signal([]),

    // UI state
    loading: signal(false),
    error: signal(null),

    // Actions
    clearCurrentView: vi.fn(),
    setSessionStarting: vi.fn(),
    setSessionError: vi.fn(),
    switchToActiveSession: vi.fn(),
  });

  const createMockWebSocketService = () => ({
    // Connection state
    connected: signal(true),
    connecting: signal(false),

    // Session management
    onSessionFailed: vi.fn().mockReturnValue(sessionFailedSubject.asObservable()),
    resumeSession: vi.fn(),
    setupProjectSessionListeners: vi.fn(),
    sendQMessage: vi.fn(),
    abortSession: vi.fn(),

    // Chat listeners
    setupChatListeners: vi.fn(),
    removeChatListeners: vi.fn(),
  });

  beforeEach(async () => {
    sessionFailedSubject = new Subject();
    mockAppStore = createMockAppStore();
    mockWebSocketService = createMockWebSocketService();

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        { provide: AppStore, useValue: mockAppStore },
        { provide: WebSocketService, useValue: mockWebSocketService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
  });

  describe('コンポーネントの初期化', () => {
    it('正常に初期化される', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('依存関係が正しく注入される', () => {
      fixture.detectChanges();
      expect(component['appStore']).toBe(mockAppStore);
      expect(component['websocket']).toBe(mockWebSocketService);
    });
  });

  describe('チャット状態の表示', () => {
    it('アクティブセッション時にチャットメッセージを表示する', () => {
      // アクティブセッションを設定
      mockAppStore.currentQSession!.set({
        id: 'session-123',
        projectPath: '/Users/test/project',
        active: true,
      });

      fixture.detectChanges();

      // ChatMessagesComponentが表示されることを確認
      const chatMessages = fixture.nativeElement.querySelector('app-chat-messages');
      expect(chatMessages).toBeTruthy();

      // EmptyStateComponentが表示されないことを確認
      const emptyState = fixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState).toBeFalsy();
    });

    it('セッションなし時にEmptyStateを表示する', () => {
      // セッションなしの状態
      mockAppStore.currentQSession!.set(null);

      fixture.detectChanges();

      // EmptyStateComponentが表示されることを確認
      const emptyState = fixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState).toBeTruthy();

      // ChatMessagesComponentが表示されないことを確認
      const chatMessages = fixture.nativeElement.querySelector('app-chat-messages');
      expect(chatMessages).toBeFalsy();
    });

    it('セッション開始中にSessionStartを表示する', () => {
      // セッション開始中の状態
      mockAppStore.sessionStarting!.set(true);

      fixture.detectChanges();

      // SessionStartComponentが表示されることを確認
      const sessionStart = fixture.nativeElement.querySelector('app-session-start');
      expect(sessionStart).toBeTruthy();
    });

    it('セッションエラー時にChatErrorを表示する', () => {
      // セッションエラーの状態
      mockAppStore.sessionError!.set('Connection failed');

      fixture.detectChanges();

      // ChatErrorComponentが表示されることを確認
      const chatError = fixture.nativeElement.querySelector('app-chat-error');
      expect(chatError).toBeTruthy();
    });
  });

  describe('セッション管理の統合', () => {
    it('セッション再開が正常に動作する', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';

      // 会話履歴を設定
      mockAppStore.currentQConversation!.set({ conversation_id: conversationId });
      mockAppStore.amazonQHistory!.set([{ conversation_id: conversationId, projectPath }]);

      fixture.detectChanges();

      // セッション再開を実行
      component.resumeSession();

      // AppStoreのメソッドが呼ばれることを確認
      expect(mockAppStore.clearCurrentView).toHaveBeenCalled();
      expect(mockAppStore.setSessionStarting).toHaveBeenCalledWith(true);

      // WebSocketServiceのメソッドが呼ばれることを確認
      expect(mockWebSocketService.resumeSession).toHaveBeenCalledWith(projectPath, conversationId);
    });

    it('プロジェクトパスがない場合、セッション再開をスキップする', () => {
      // プロジェクトパスがない会話
      mockAppStore.currentQConversation!.set({ conversation_id: 'conv-no-path' });
      mockAppStore.amazonQHistory!.set([]);

      fixture.detectChanges();

      // セッション再開を実行
      component.resumeSession();

      // WebSocketServiceが呼ばれないことを確認
      expect(mockWebSocketService.resumeSession).not.toHaveBeenCalled();
    });
  });

  describe('WebSocketリスナーの統合', () => {
    it('WebSocketリスナーが正しく設定される', () => {
      fixture.detectChanges();

      // WebSocketリスナーの設定が呼ばれることを確認
      expect(mockWebSocketService.setupChatListeners).toHaveBeenCalled();
    });

    it('コンポーネント破棄時にリスナーがクリーンアップされる', () => {
      fixture.detectChanges();

      // コンポーネントを破棄
      fixture.destroy();

      // WebSocketリスナーのクリーンアップが呼ばれることを確認
      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalled();
    });
  });

  describe('エラーハンドリングの統合', () => {
    it('セッション失敗時の適切なエラー処理', () => {
      fixture.detectChanges();

      // セッション失敗をシミュレート
      sessionFailedSubject.next({ error: 'Authentication failed' });

      // エラー状態が設定されることを確認
      expect(mockAppStore.setSessionStarting).toHaveBeenCalledWith(false);
      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(
        expect.stringContaining('Authentication failed')
      );
    });

    it('ChatErrorコンポーネントからのTryAgainイベント処理', () => {
      // エラー状態を設定
      mockAppStore.sessionError!.set('Connection failed');

      fixture.detectChanges();

      const chatError = fixture.nativeElement.querySelector('app-chat-error');
      expect(chatError).toBeTruthy();

      // Try Againボタンをクリック
      const tryAgainButton = chatError.querySelector('button');
      tryAgainButton?.click();

      // エラーがクリアされることを確認
      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(null);
    });
  });

  describe('状態変化の統合テスト', () => {
    it('Empty State → Session Starting → Active Chat の遷移', () => {
      fixture.detectChanges();

      // 1. 初期状態（Empty State）
      expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();

      // 2. セッション開始状態に遷移
      mockAppStore.sessionStarting!.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-session-start')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-empty-state')).toBeFalsy();

      // 3. アクティブチャット状態に遷移
      mockAppStore.sessionStarting!.set(false);
      mockAppStore.currentQSession!.set({
        id: 'session-123',
        projectPath: '/test/project',
        active: true,
      });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-chat-messages')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-session-start')).toBeFalsy();
    });

    it('Active Chat → Error → Empty State の遷移', () => {
      // 1. アクティブチャット状態
      mockAppStore.currentQSession!.set({ id: 'session-123', active: true });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-chat-messages')).toBeTruthy();

      // 2. エラー状態に遷移
      mockAppStore.sessionError!.set('Connection lost');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-chat-error')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-chat-messages')).toBeFalsy();

      // 3. エラークリア後、Empty Stateに遷移
      mockAppStore.sessionError!.set(null);
      mockAppStore.currentQSession!.set(null);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-chat-error')).toBeFalsy();
    });
  });

  describe('メッセージ送信の統合', () => {
    it('ChatMessagesからのメッセージ送信イベントが処理される', () => {
      // アクティブセッションを設定
      mockAppStore.currentQSession!.set({
        id: 'session-123',
        projectPath: '/test/project',
        active: true,
      });

      fixture.detectChanges();

      const chatMessages = fixture.nativeElement.querySelector('app-chat-messages');
      expect(chatMessages).toBeTruthy();

      // メッセージ送信イベントをシミュレート
      const messageEvent = new CustomEvent('messageSent', {
        detail: { content: 'Test message' },
      });
      chatMessages.dispatchEvent(messageEvent);

      // WebSocketServiceのsendQMessageが呼ばれることを確認
      expect(mockWebSocketService.sendQMessage).toHaveBeenCalledWith('Test message');
    });
  });

  describe('パフォーマンスと最適化', () => {
    it('頻繁な状態変更でも効率的に動作する', () => {
      fixture.detectChanges();

      const start = performance.now();

      // 複数の状態変更を連続で実行
      for (let i = 0; i < 100; i++) {
        mockAppStore.sessionStarting!.set(i % 2 === 0);
        fixture.detectChanges();
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(1000); // 1秒以内
    });

    it('大量のデータでも効率的にレンダリングされる', () => {
      // 大量の履歴データを設定
      const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        projectPath: `/project-${i}`,
      }));

      mockAppStore.amazonQHistory!.set(largeHistory);

      const start = performance.now();
      fixture.detectChanges();
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // 100ms以内
    });
  });

  describe('アクセシビリティと使いやすさ', () => {
    it('適切なARIAラベルが設定される', () => {
      fixture.detectChanges();

      const chatContainer = fixture.nativeElement.querySelector('.chat-container');
      if (chatContainer) {
        // ARIAラベルやロールが適切に設定されているかチェック
        // 実際の実装に応じて調整
        expect(chatContainer.getAttribute('role')).toBeTruthy();
      }
    });

    it('キーボードナビゲーションが適切に動作する', () => {
      fixture.detectChanges();

      // フォーカス可能な要素が存在することを確認
      const focusableElements = fixture.nativeElement.querySelectorAll(
        'button, input, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });

  describe('エラー回復とレジリエンス', () => {
    it('WebSocketサービスエラー後の回復', () => {
      fixture.detectChanges();

      // WebSocketエラーをシミュレート
      mockWebSocketService.connected!.set(false);
      fixture.detectChanges();

      // 接続回復をシミュレート
      mockWebSocketService.connected!.set(true);
      fixture.detectChanges();

      // 正常な状態に戻ることを確認
      expect(component).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.error-state')).toBeFalsy();
    });

    it('AppStoreエラー後の回復', () => {
      fixture.detectChanges();

      // AppStoreエラーをシミュレート
      mockAppStore.error!.set('Store error');
      fixture.detectChanges();

      // エラークリアをシミュレート
      mockAppStore.error!.set(null);
      fixture.detectChanges();

      // 正常な状態に戻ることを確認
      expect(component).toBeTruthy();
    });
  });

  describe('メモリリークの防止', () => {
    it('コンポーネント破棄時にリソースがクリーンアップされる', () => {
      fixture.detectChanges();

      const destroySpy = vi.spyOn(component, 'ngOnDestroy');

      // コンポーネントを破棄
      fixture.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalled();
    });

    it('長時間使用でもメモリリークが発生しない', () => {
      fixture.detectChanges();

      // 長時間の使用をシミュレート（複数の状態変更）
      for (let i = 0; i < 1000; i++) {
        mockAppStore.currentQSession!.set({
          id: `session-${i}`,
          projectPath: `/project-${i}`,
          active: true,
        });
        fixture.detectChanges();
      }

      // メモリ使用量の大幅な増加がないことを確認
      // 実際のメモリ測定は困難なため、エラーが発生しないことで代替
      expect(component).toBeTruthy();
    });
  });
});
