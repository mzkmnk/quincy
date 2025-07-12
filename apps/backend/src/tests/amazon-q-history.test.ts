/**
 * Amazon Q History Service Test
 * TDD approach: テストファーストで実装
 */

import { AmazonQHistoryService, QHistoryDatabase, QHistoryTab, QHistorySearchOptions } from '../services/amazon-q-history';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// fs/promisesモジュールのモック
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// osモジュールのモック
jest.mock('os');
const mockOs = os as jest.Mocked<typeof os>;

// モックデータ
const mockHistoryDatabase: QHistoryDatabase = {
  filename: 'chat-history-test.json',
  collections: [
    {
      name: 'tabs',
      data: [
        {
          historyId: 'test-history-1',
          workspaceId: 'workspace-1',
          projectPath: '/test/project1',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Hello, how can I implement a function?',
              timestamp: 1699876543000
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Here is how you can implement the function...',
              timestamp: 1699876544000
            }
          ],
          title: 'Function Implementation',
          isOpen: false,
          createdAt: 1699876543000,
          updatedAt: 1699876544000
        },
        {
          historyId: 'test-history-2',
          workspaceId: 'workspace-2',
          projectPath: '/test/project2',
          messages: [
            {
              id: 'msg-3',
              role: 'user',
              content: 'How to debug TypeScript errors?',
              timestamp: 1699876600000
            }
          ],
          title: 'TypeScript Debugging',
          isOpen: true,
          createdAt: 1699876600000,
          updatedAt: 1699876600000
        }
      ],
      idIndex: null,
      binaryIndices: {},
      constraints: null,
      uniqueNames: ['historyId'],
      transforms: {},
      objType: 'tabs',
      dirty: false,
      maxId: 2,
      DynamicViews: [],
      events: {},
      changes: [],
      dirtyIds: [],
      isIncremental: false
    }
  ],
  databaseVersion: 1.5,
  engineVersion: 1.5,
  autosave: true,
  autosaveInterval: 1000,
  options: {},
  persistenceMethod: 'fs',
  ENV: 'NODEJS',
  isIncremental: false
};

describe('AmazonQHistoryService', () => {
  let service: AmazonQHistoryService;
  const mockHistoryDir = '/mock/history/path';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // osのホームディレクトリをモック
    mockOs.homedir.mockReturnValue('/mock/home');
    
    // カスタム履歴ディレクトリでサービスを初期化
    service = new AmazonQHistoryService(mockHistoryDir);
  });

  afterEach(async () => {
    await service.shutdown();
  });

  describe('インスタンス作成', () => {
    it('AmazonQHistoryServiceのインスタンスが作成できること', () => {
      expect(service).toBeInstanceOf(AmazonQHistoryService);
    });

    it('デフォルトの履歴ディレクトリが設定されること', () => {
      const defaultService = new AmazonQHistoryService();
      expect(mockOs.homedir).toHaveBeenCalled();
      expect(defaultService).toBeInstanceOf(AmazonQHistoryService);
    });
  });

  describe('getAvailableHistoryFiles', () => {
    it('履歴ファイル一覧を取得できること', async () => {
      const mockFiles = [
        'chat-history-abc123.json',
        'chat-history-def456.json',
        'other-file.txt',
        'chat-history-ghi789.json'
      ];
      
      mockFs.readdir.mockResolvedValue(mockFiles as any);

      const files = await service.getAvailableHistoryFiles();

      expect(mockFs.readdir).toHaveBeenCalledWith(mockHistoryDir);
      expect(files).toEqual([
        'chat-history-ghi789.json',
        'chat-history-def456.json',
        'chat-history-abc123.json'
      ]);
    });

    it('履歴ディレクトリが存在しない場合は空配列を返すこと', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const files = await service.getAvailableHistoryFiles();

      expect(files).toEqual([]);
    });
  });

  describe('loadHistoryFile', () => {
    it('履歴ファイルを読み込めること', async () => {
      const filename = 'chat-history-test.json';
      const mockFileContent = JSON.stringify(mockHistoryDatabase);
      
      mockFs.readFile.mockResolvedValue(mockFileContent);

      const result = await service.loadHistoryFile(filename);

      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(mockHistoryDir, filename),
        'utf8'
      );
      expect(result).toEqual(mockHistoryDatabase);
    });

    it('存在しないファイルの場合はnullを返すこと', async () => {
      const filename = 'nonexistent.json';
      
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await service.loadHistoryFile(filename);

      expect(result).toBeNull();
    });

    it('キャッシュから履歴ファイルを取得できること', async () => {
      const filename = 'chat-history-test.json';
      const mockFileContent = JSON.stringify(mockHistoryDatabase);
      
      mockFs.readFile.mockResolvedValue(mockFileContent);

      // 最初の読み込み
      const result1 = await service.loadHistoryFile(filename);
      
      // 2回目の読み込み（キャッシュから）
      const result2 = await service.loadHistoryFile(filename);

      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });
  });

  describe('getWorkspaceHistory', () => {
    beforeEach(() => {
      const mockFiles = ['chat-history-test.json'];
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockHistoryDatabase));
    });

    it('ワークスペース固有の履歴を取得できること', async () => {
      const workspaceId = 'workspace-1';

      const result = await service.getWorkspaceHistory(workspaceId);

      expect(result).toHaveLength(1);
      expect(result[0].workspaceId).toBe(workspaceId);
      expect(result[0].historyId).toBe('test-history-1');
    });

    it('該当するワークスペースがない場合は空配列を返すこと', async () => {
      const workspaceId = 'nonexistent-workspace';

      const result = await service.getWorkspaceHistory(workspaceId);

      expect(result).toEqual([]);
    });
  });

  describe('getProjectHistory', () => {
    beforeEach(() => {
      const mockFiles = ['chat-history-test.json'];
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockHistoryDatabase));
    });

    it('プロジェクト固有の履歴を取得できること', async () => {
      const projectPath = '/test/project1';

      const result = await service.getProjectHistory(projectPath);

      expect(result).toHaveLength(1);
      expect(result[0].projectPath).toBe(projectPath);
      expect(result[0].historyId).toBe('test-history-1');
    });

    it('部分一致でプロジェクト履歴を取得できること', async () => {
      const projectPath = '/test';

      const result = await service.getProjectHistory(projectPath);

      expect(result).toHaveLength(2);
    });
  });

  describe('searchHistory', () => {
    beforeEach(() => {
      const mockFiles = ['chat-history-test.json'];
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockHistoryDatabase));
    });

    it('メッセージテキストで検索できること', async () => {
      const options: QHistorySearchOptions = {
        messageText: 'TypeScript'
      };

      const result = await service.searchHistory(options);

      expect(result).toHaveLength(1);
      expect(result[0].historyId).toBe('test-history-2');
    });

    it('ワークスペースIDで検索できること', async () => {
      const options: QHistorySearchOptions = {
        workspaceId: 'workspace-1'
      };

      const result = await service.searchHistory(options);

      expect(result).toHaveLength(1);
      expect(result[0].workspaceId).toBe('workspace-1');
    });

    it('日付範囲で検索できること', async () => {
      const options: QHistorySearchOptions = {
        fromDate: new Date(1699876550000),
        toDate: new Date(1699876650000)
      };

      const result = await service.searchHistory(options);

      expect(result).toHaveLength(1);
      expect(result[0].historyId).toBe('test-history-2');
    });

    it('検索結果の上限制限が機能すること', async () => {
      const options: QHistorySearchOptions = {
        limit: 1
      };

      const result = await service.searchHistory(options);

      expect(result).toHaveLength(1);
    });
  });

  describe('getHistorySession', () => {
    beforeEach(() => {
      const mockFiles = ['chat-history-test.json'];
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockHistoryDatabase));
    });

    it('指定履歴IDのセッションを取得できること', async () => {
      const historyId = 'test-history-1';

      const result = await service.getHistorySession(historyId);

      expect(result).toBeDefined();
      expect(result?.historyId).toBe(historyId);
      expect(result?.messages).toHaveLength(2);
    });

    it('存在しない履歴IDの場合はnullを返すこと', async () => {
      const historyId = 'nonexistent-history';

      const result = await service.getHistorySession(historyId);

      expect(result).toBeNull();
    });
  });

  describe('getHistoryStats', () => {
    beforeEach(() => {
      const mockFiles = ['chat-history-test.json'];
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockHistoryDatabase));
    });

    it('履歴統計を取得できること', async () => {
      const stats = await service.getHistoryStats();

      expect(stats.totalSessions).toBe(2);
      expect(stats.totalMessages).toBe(3);
      expect(stats.avgMessagesPerSession).toBe(1.5);
      expect(stats.workspaces).toContain('workspace-1');
      expect(stats.workspaces).toContain('workspace-2');
      expect(stats.workspaces).toContain('/test/project1');
      expect(stats.workspaces).toContain('/test/project2');
    });
  });

  describe('exportForAmazonQ', () => {
    beforeEach(() => {
      const mockFiles = ['chat-history-test.json'];
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockHistoryDatabase));
    });

    it('Amazon Q CLI形式でエクスポートできること', async () => {
      const historyId = 'test-history-1';

      const result = await service.exportForAmazonQ(historyId);

      expect(result).toBeDefined();
      expect(result).toContain('Human: Hello, how can I implement a function?');
      expect(result).toContain('Assistant: Here is how you can implement the function...');
    });

    it('存在しない履歴IDの場合はnullを返すこと', async () => {
      const historyId = 'nonexistent-history';

      const result = await service.exportForAmazonQ(historyId);

      expect(result).toBeNull();
    });
  });

  describe('キャッシュ管理', () => {
    it('キャッシュをクリアできること', async () => {
      const filename = 'chat-history-test.json';
      const mockFileContent = JSON.stringify(mockHistoryDatabase);
      
      mockFs.readFile.mockResolvedValue(mockFileContent);

      // ファイルを読み込んでキャッシュに保存
      await service.loadHistoryFile(filename);
      
      // キャッシュをクリア
      service.clearCache();
      
      // 再度読み込み（ファイルシステムから）
      await service.loadHistoryFile(filename);

      expect(mockFs.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('イベント処理', () => {
    it('履歴読み込み時にイベントが発行されること', (done) => {
      const filename = 'chat-history-test.json';
      const mockFileContent = JSON.stringify(mockHistoryDatabase);
      
      mockFs.readFile.mockResolvedValue(mockFileContent);

      service.on('history:loaded', (data) => {
        expect(data.filename).toBe(filename);
        expect(data.tabCount).toBe(2);
        done();
      });

      service.loadHistoryFile(filename);
    });

    it('履歴エラー時にイベントが発行されること', (done) => {
      const filename = 'chat-history-error.json';
      
      mockFs.readFile.mockRejectedValue(new Error('File read error'));

      service.on('history:error', (data) => {
        expect(data.filename).toBe(filename);
        expect(data.error).toContain('File read error');
        done();
      });

      service.loadHistoryFile(filename);
    });
  });
});