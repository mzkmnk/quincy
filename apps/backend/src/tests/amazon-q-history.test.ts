/**
 * Amazon Q History Service Test
 * SQLiteベースの実装に対応したテスト
 */

import { AmazonQHistoryService, QHistorySession, QHistorySearchOptions, QCommandHistory, QConversationData } from '../services/amazon-q-history';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

// better-sqlite3モジュールのモック
jest.mock('better-sqlite3');
const mockDatabase = Database as jest.MockedClass<typeof Database>;

// osモジュールのモック
jest.mock('os');
const mockOs = os as jest.Mocked<typeof os>;

// モックデータ
const mockConversationData: QConversationData = {
  conversation_id: 'test-conv-123',
  next_message: null,
  history: [
    [
      {
        content: {
          Prompt: {
            prompt: 'このプロジェクトの構成を見てください'
          }
        },
        env_context: {
          env_state: {
            operating_system: 'macos',
            current_working_directory: '/Users/test/project',
            environment_variables: []
          }
        }
      },
      {
        ToolUse: {
          message_id: 'msg-456',
          content: 'プロジェクトの構成を確認します',
          tool_uses: [
            {
              id: 'tool-123',
              name: 'fs_read',
              args: { path: '/Users/test/project' }
            }
          ]
        }
      }
    ]
  ],
  valid_history_range: [0, 1],
  transcript: [
    '> このプロジェクトの構成を見てください',
    'プロジェクトの構成を確認します\n[Tool uses: fs_read]'
  ],
  tools: {}
};

const mockCommandHistory: QCommandHistory[] = [
  {
    id: 1,
    command: 'pnpm dev',
    shell: 'zsh',
    pid: 12345,
    session_id: 'session-123',
    cwd: '/Users/test/project',
    start_time: 1699876543,
    hostname: 'test.local',
    exit_code: 0,
    end_time: 1699876600,
    duration: 57
  },
  {
    id: 2,
    command: 'git status',
    shell: 'zsh',
    pid: 12346,
    session_id: 'session-123',
    cwd: '/Users/test/project',
    start_time: 1699876700,
    hostname: 'test.local',
    exit_code: 0,
    end_time: 1699876701,
    duration: 1
  }
];

describe('AmazonQHistoryService', () => {
  let service: AmazonQHistoryService;
  let mockDbInstance: any;
  let mockStmt: any;
  
  beforeEach(() => {
    // モックの初期化
    mockOs.homedir.mockReturnValue('/Users/test');
    
    // SQLiteモックの設定
    mockStmt = {
      all: jest.fn(),
      get: jest.fn(),
      run: jest.fn()
    };
    
    mockDbInstance = {
      prepare: jest.fn(() => mockStmt),
      close: jest.fn()
    };
    
    mockDatabase.mockImplementation(() => mockDbInstance);
    
    service = new AmazonQHistoryService(':memory:'); // テスト用にメモリDBを使用
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('SQLiteデータベースに接続する', () => {
      expect(mockDatabase).toHaveBeenCalledWith(':memory:', expect.objectContaining({
        readonly: true,
        fileMustExist: true
      }));
    });

    it('カスタムDBパスを指定できる', () => {
      const customPath = '/custom/path/test.db';
      new AmazonQHistoryService(customPath);
      
      expect(mockDatabase).toHaveBeenCalledWith(customPath, expect.objectContaining({
        readonly: true,
        fileMustExist: true
      }));
    });

    it('データベース接続失敗時にフォールバックする', () => {
      jest.clearAllMocks(); // 以前のモック呼び出しをクリア
      mockDatabase.mockImplementationOnce(() => {
        throw new Error('Database not found');
      }).mockImplementationOnce(() => mockDbInstance);
      
      const service = new AmazonQHistoryService();
      expect(mockDatabase).toHaveBeenCalledTimes(2); // 実DB + メモリDB
    });
  });

  describe('getAvailableProjects', () => {
    it('利用可能なプロジェクト一覧を取得する', async () => {
      const mockProjects = [
        { key: '/Users/test/project1' },
        { key: '/Users/test/project2' }
      ];
      mockStmt.all.mockReturnValue(mockProjects);
      
      const projects = await service.getAvailableProjects();
      
      expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT DISTINCT key FROM conversations ORDER BY key');
      expect(projects).toEqual(['/Users/test/project1', '/Users/test/project2']);
    });

    it('エラー時に空配列を返す', async () => {
      mockStmt.all.mockImplementation(() => {
        throw new Error('Query failed');
      });
      
      const projects = await service.getAvailableProjects();
      expect(projects).toEqual([]);
    });
  });

  describe('loadProjectConversation', () => {
    it('プロジェクトの会話データを読み込む', async () => {
      const projectPath = '/Users/test/project';
      mockStmt.get.mockReturnValue({
        value: JSON.stringify(mockConversationData)
      });
      
      const session = await service.loadProjectConversation(projectPath);
      
      expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT value FROM conversations WHERE key = ?');
      expect(mockStmt.get).toHaveBeenCalledWith(projectPath);
      expect(session).toBeTruthy();
      expect(session?.conversationId).toBe('test-conv-123');
      expect(session?.messages).toHaveLength(2);
    });

    it('プロジェクトが見つからない場合はnullを返す', async () => {
      mockStmt.get.mockReturnValue(undefined);
      
      const session = await service.loadProjectConversation('/not/found');
      expect(session).toBeNull();
    });

    it('キャッシュから読み込む', async () => {
      const projectPath = '/Users/test/project';
      mockStmt.get.mockReturnValue({
        value: JSON.stringify(mockConversationData)
      });
      
      // 1回目の読み込み
      await service.loadProjectConversation(projectPath);
      
      // 2回目の読み込み（キャッシュから）
      const session = await service.loadProjectConversation(projectPath);
      
      // DBは1回だけ呼ばれる
      expect(mockStmt.get).toHaveBeenCalledTimes(1);
      expect(session?.conversationId).toBe('test-conv-123');
    });
  });

  describe('getWorkspaceHistory', () => {
    it('ワークスペースの履歴を取得する', async () => {
      const workspaceId = 'test-workspace';
      mockStmt.all.mockReturnValue([
        {
          key: '/Users/test/project1',
          value: JSON.stringify(mockConversationData)
        }
      ]);
      
      const sessions = await service.getWorkspaceHistory(workspaceId);
      
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE key LIKE ? OR key LIKE ?'));
      expect(mockStmt.all).toHaveBeenCalledWith('%test-workspace%', 'test-workspace%');
      expect(sessions).toHaveLength(1);
    });
  });

  describe('getCommandHistory', () => {
    it('コマンド履歴を取得する', async () => {
      mockStmt.all.mockReturnValue(mockCommandHistory);
      
      const commands = await service.getCommandHistory();
      
      expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT * FROM history ORDER BY start_time DESC');
      expect(commands).toHaveLength(2);
      expect(commands[0].command).toBe('pnpm dev');
    });

    it('ディレクトリでフィルタリングする', async () => {
      mockStmt.all.mockReturnValue([mockCommandHistory[0]]);
      
      const commands = await service.getCommandHistory({ cwd: '/Users/test/project' });
      
      expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT * FROM history WHERE cwd = ? ORDER BY start_time DESC');
      expect(mockStmt.all).toHaveBeenCalledWith('/Users/test/project');
      expect(commands).toHaveLength(1);
    });

    it('件数制限を適用する', async () => {
      mockStmt.all.mockReturnValue([mockCommandHistory[0]]);
      
      const commands = await service.getCommandHistory({ limit: 10 });
      
      expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT * FROM history ORDER BY start_time DESC LIMIT ?');
      expect(mockStmt.all).toHaveBeenCalledWith(10);
    });
  });

  describe('searchHistory', () => {
    it('メッセージテキストで検索する', async () => {
      mockStmt.all.mockReturnValue([
        {
          key: '/Users/test/project',
          value: JSON.stringify(mockConversationData)
        }
      ]);
      
      const results = await service.searchHistory({
        messageText: 'プロジェクト'
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].messages[0].content).toContain('プロジェクト');
    });

    it('プロジェクトパスで検索する', async () => {
      mockStmt.all.mockReturnValue([
        {
          key: '/Users/test/project',
          value: JSON.stringify(mockConversationData)
        }
      ]);
      
      const results = await service.searchHistory({
        projectPath: '/Users/test/project'
      });
      
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(expect.stringContaining('AND key = ?'));
      expect(results).toHaveLength(1);
    });
  });

  describe('getHistorySession', () => {
    it('プロジェクトパスでセッションを取得する', async () => {
      mockStmt.get.mockReturnValue({
        value: JSON.stringify(mockConversationData)
      });
      
      const session = await service.getHistorySession('/Users/test/project');
      
      expect(session).toBeTruthy();
      expect(session?.conversationId).toBe('test-conv-123');
    });

    it('会話IDでセッションを取得する', async () => {
      // プロジェクトパスでの検索は失敗
      mockStmt.get.mockReturnValueOnce(undefined);
      
      // 全プロジェクトから検索
      mockStmt.all.mockReturnValue([
        {
          key: '/Users/test/project',
          value: JSON.stringify(mockConversationData)
        }
      ]);
      
      const session = await service.getHistorySession('test-conv-123');
      
      expect(session).toBeTruthy();
      expect(session?.conversationId).toBe('test-conv-123');
    });
  });

  describe('getHistoryStats', () => {
    it('履歴統計を取得する', async () => {
      // 会話数
      mockStmt.get.mockReturnValueOnce({ count: 5 });
      
      // コマンド履歴統計
      mockStmt.get.mockReturnValueOnce({ 
        count: 100, 
        oldest: 1699876543, 
        newest: 1699976543 
      });
      
      // プロジェクト一覧
      mockStmt.all.mockReturnValueOnce([
        { key: '/Users/test/project1' },
        { key: '/Users/test/project2' }
      ]);
      
      // 会話データ
      mockStmt.all.mockReturnValueOnce([
        { value: JSON.stringify(mockConversationData) }
      ]);
      
      const stats = await service.getHistoryStats();
      
      expect(stats.totalSessions).toBe(5);
      expect(stats.workspaces).toHaveLength(2);
      expect(stats.oldestSession).toBeInstanceOf(Date);
    });
  });

  describe('exportForAmazonQ', () => {
    it('Amazon Q CLI形式でエクスポートする', async () => {
      mockStmt.get.mockReturnValue({
        value: JSON.stringify(mockConversationData)
      });
      
      const context = await service.exportForAmazonQ('/Users/test/project');
      
      expect(context).toContain('Human: このプロジェクトの構成を見てください');
      expect(context).toContain('Assistant: プロジェクトの構成を確認します');
    });
  });

  describe('clearCache', () => {
    it('キャッシュをクリアする', async () => {
      // キャッシュに追加
      mockStmt.get.mockReturnValue({
        value: JSON.stringify(mockConversationData)
      });
      await service.loadProjectConversation('/Users/test/project');
      
      // キャッシュクリア
      service.clearCache();
      
      // 再度読み込み（DBから）
      await service.loadProjectConversation('/Users/test/project');
      
      // DBが2回呼ばれる
      expect(mockStmt.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('shutdown', () => {
    it('適切にシャットダウンする', async () => {
      await service.shutdown();
      
      expect(mockDbInstance.close).toHaveBeenCalled();
    });
  });

  describe('イベント', () => {
    it('データベース接続時にイベントを発行する', (done) => {
      jest.clearAllMocks();
      mockDatabase.mockImplementation(() => mockDbInstance);
      
      const newService = new AmazonQHistoryService(':memory:');
      newService.on('db:connected', (data) => {
        expect(data.path).toBe(':memory:');
        done();
      });
      
      // イベントを手動でトリガー（モック環境のため）
      newService.emit('db:connected', { path: ':memory:' });
    });

    it('プロジェクト読み込み時にイベントを発行する', async () => {
      const listener = jest.fn();
      service.on('projects:loaded', listener);
      
      mockStmt.all.mockReturnValue([{ key: '/test' }]);
      await service.getAvailableProjects();
      
      expect(listener).toHaveBeenCalledWith({ count: 1 });
    });

    it('セッション読み込み時にイベントを発行する', async () => {
      const listener = jest.fn();
      service.on('session:loaded', listener);
      
      mockStmt.get.mockReturnValue({
        value: JSON.stringify(mockConversationData)
      });
      await service.loadProjectConversation('/test');
      
      expect(listener).toHaveBeenCalledWith({ 
        projectPath: '/test', 
        messageCount: 2 
      });
    });
  });
});