import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ChatHeaderComponent } from './chat-header.component';
import { AppStore } from '../../../../core/store/app.state';
import { WebSocketService } from '../../../../core/services/websocket.service';

describe('ChatHeaderComponent', () => {
  let component: ChatHeaderComponent;
  let fixture: ComponentFixture<ChatHeaderComponent>;
  let mockAppStore: any;
  let mockWebSocketService: any;

  // テストヘルパー関数
  const createMockAppStore = () => ({
    currentQSession: signal(null),
    currentQConversation: signal(null),
    sessionStarting: signal(false),
    sessionError: signal(null),
    amazonQHistory: signal([])
  });

  const createMockWebSocketService = () => ({
    connected: signal(false),
    connecting: signal(false)
  });

  const createSessionData = (projectPath: string) => ({
    id: 'session-1',
    projectPath,
    active: true
  });

  const createConversationData = (conversationId: string) => ({
    conversation_id: conversationId,
    title: 'Test Conversation'
  });

  const createHistoryItem = (conversationId: string, projectPath: string) => ({
    conversation_id: conversationId,
    projectPath,
    title: 'Test History'
  });

  beforeEach(async () => {
    mockAppStore = createMockAppStore();
    mockWebSocketService = createMockWebSocketService();

    await TestBed.configureTestingModule({
      imports: [ChatHeaderComponent],
      providers: [
        { provide: AppStore, useValue: mockAppStore },
        { provide: WebSocketService, useValue: mockWebSocketService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatHeaderComponent);
    component = fixture.componentInstance;
  });

  describe('コンポーネント初期化', () => {
    it('コンポーネントが正常に作成される', () => {
      expect(component).toBeTruthy();
    });

    it('AppStoreとWebSocketServiceが正しく注入される', () => {
      expect(component['appStore']).toBe(mockAppStore);
      expect(component['websocket']).toBe(mockWebSocketService);
    });
  });

  describe('getProjectName', () => {
    it('プロジェクトパスからプロジェクト名を正しく抽出する', () => {
      expect(component.getProjectName('/Users/user/projects/my-app')).toBe('my-app');
      expect(component.getProjectName('/home/developer/workspace/frontend')).toBe('frontend');
    });

    it('スラッシュで終わるパスを正しく処理する', () => {
      expect(component.getProjectName('/Users/user/projects/my-app/')).toBe('my-app');
    });

    it('ルートパスの場合、パス全体を返す', () => {
      expect(component.getProjectName('/')).toBe('/');
    });

    it('空文字列の場合、"Unknown Project"を返す', () => {
      expect(component.getProjectName('')).toBe('Unknown Project');
    });

    it('パスセパレーターがない場合、パス全体をプロジェクト名として返す', () => {
      expect(component.getProjectName('project-name')).toBe('project-name');
    });
  });

  describe('getProjectPathFromConversation', () => {
    it('現在の会話がない場合、空文字列を返す', () => {
      mockAppStore.currentQConversation.set(null);
      expect(component.getProjectPathFromConversation()).toBe('');
    });

    it('現在の会話があるが、履歴に対応するアイテムがない場合、空文字列を返す', () => {
      const conversation = createConversationData('conv-1');
      mockAppStore.currentQConversation.set(conversation);
      mockAppStore.amazonQHistory.set([]);
      
      expect(component.getProjectPathFromConversation()).toBe('');
    });

    it('現在の会話に対応する履歴からプロジェクトパスを取得する', () => {
      const conversation = createConversationData('conv-1');
      const historyItem = createHistoryItem('conv-1', '/Users/user/test-project');
      
      mockAppStore.currentQConversation.set(conversation);
      mockAppStore.amazonQHistory.set([historyItem]);
      
      expect(component.getProjectPathFromConversation()).toBe('/Users/user/test-project');
    });

    it('複数の履歴アイテムから正しいものを選択する', () => {
      const conversation = createConversationData('conv-2');
      const historyItems = [
        createHistoryItem('conv-1', '/Users/user/project-1'),
        createHistoryItem('conv-2', '/Users/user/project-2'),
        createHistoryItem('conv-3', '/Users/user/project-3')
      ];
      
      mockAppStore.currentQConversation.set(conversation);
      mockAppStore.amazonQHistory.set(historyItems);
      
      expect(component.getProjectPathFromConversation()).toBe('/Users/user/project-2');
    });

    it('履歴アイテムにprojectPathがない場合、空文字列を返す', () => {
      const conversation = createConversationData('conv-1');
      const historyItem = { ...createHistoryItem('conv-1', ''), projectPath: undefined };
      
      mockAppStore.currentQConversation.set(conversation);
      mockAppStore.amazonQHistory.set([historyItem]);
      
      expect(component.getProjectPathFromConversation()).toBe('');
    });
  });

  describe('テンプレートレンダリング', () => {
    it('デフォルト状態で"Quincy"タイトルを表示する', () => {
      fixture.detectChanges();
      const titleElement = fixture.nativeElement.querySelector('h1');
      expect(titleElement.textContent.trim()).toBe('Quincy');
    });

    it('アクティブセッションがある場合、プロジェクト名を表示する', () => {
      const session = createSessionData('/Users/user/my-project');
      mockAppStore.currentQSession.set(session);
      
      fixture.detectChanges();
      const titleElement = fixture.nativeElement.querySelector('h1');
      expect(titleElement.textContent.trim()).toBe('my-project');
    });

    it('現在の会話がある場合、会話のプロジェクト名を表示する', () => {
      const conversation = createConversationData('conv-1');
      const historyItem = createHistoryItem('conv-1', '/Users/user/chat-project');
      
      mockAppStore.currentQConversation.set(conversation);
      mockAppStore.amazonQHistory.set([historyItem]);
      
      fixture.detectChanges();
      const titleElement = fixture.nativeElement.querySelector('h1');
      expect(titleElement.textContent.trim()).toBe('chat-project');
    });

    it('セッション開始中の場合、適切なメッセージを表示する', () => {
      mockAppStore.sessionStarting.set(true);
      
      fixture.detectChanges();
      const titleElement = fixture.nativeElement.querySelector('h1');
      const descElement = fixture.nativeElement.querySelector('p');
      
      expect(titleElement.textContent.trim()).toBe('Starting Amazon Q Session...');
      expect(descElement.textContent.trim()).toBe('Please wait while we start your session');
    });

    it('セッションエラーがある場合、エラーメッセージを表示する', () => {
      mockAppStore.sessionError.set('Connection failed');
      
      fixture.detectChanges();
      const titleElement = fixture.nativeElement.querySelector('h1');
      const descElement = fixture.nativeElement.querySelector('p');
      
      expect(titleElement.textContent.trim()).toBe('Session Start Failed');
      expect(descElement.textContent.trim()).toBe('Failed to start Amazon Q session');
    });

    it('接続ステータスを正しく表示する', () => {
      // 接続済みの場合
      mockWebSocketService.connected.set(true);
      fixture.detectChanges();
      let statusElement = fixture.nativeElement.querySelector('.text-\\[var\\(--text-secondary\\)\\]');
      expect(statusElement.textContent.trim()).toBe('Connected');
      
      // 接続中の場合
      mockWebSocketService.connected.set(false);
      mockWebSocketService.connecting.set(true);
      fixture.detectChanges();
      statusElement = fixture.nativeElement.querySelector('.text-\\[var\\(--text-secondary\\)\\]');
      expect(statusElement.textContent.trim()).toBe('Connecting');
      
      // 切断されている場合
      mockWebSocketService.connected.set(false);
      mockWebSocketService.connecting.set(false);
      fixture.detectChanges();
      statusElement = fixture.nativeElement.querySelector('.text-\\[var\\(--text-secondary\\)\\]');
      expect(statusElement.textContent.trim()).toBe('Disconnected');
    });
  });

  describe('エッジケース', () => {
    it('nullセッションデータを安全に処理する', () => {
      mockAppStore.currentQSession.set(null);
      mockAppStore.currentQConversation.set(null);
      
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('不正な形式のプロジェクトパスを処理する', () => {
      expect(component.getProjectName('///')).toBe('');
      expect(component.getProjectName('//')).toBe('');
      expect(component.getProjectName('/')).toBe('/');
    });

    it('特殊文字を含むプロジェクトパスを処理する', () => {
      expect(component.getProjectName('/Users/user/project with spaces')).toBe('project with spaces');
      expect(component.getProjectName('/Users/user/project-with-dashes')).toBe('project-with-dashes');
      expect(component.getProjectName('/Users/user/project_with_underscores')).toBe('project_with_underscores');
    });

    it('非常に長いプロジェクトパスを処理する', () => {
      const longPath = '/Users/user/' + 'very-long-project-name'.repeat(10);
      const result = component.getProjectName(longPath);
      expect(result).toBe('very-long-project-name'.repeat(10));
    });
  });
});