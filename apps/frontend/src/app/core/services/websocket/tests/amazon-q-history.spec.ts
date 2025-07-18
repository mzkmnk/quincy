import { getProjectHistory, getAllProjectsHistory, getProjectHistoryDetailed } from '../amazon-q-history';

describe('Amazon Q History Functions', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      emit: jest.fn(),
      once: jest.fn(),
      connected: true
    };
  });

  describe('getProjectHistory', () => {
    it('プロジェクト履歴取得イベントを送信する', () => {
      const projectPath = '/test/project';
      
      getProjectHistory(mockSocket, projectPath);

      expect(mockSocket.emit).toHaveBeenCalledWith('q:history', { projectPath });
    });

    it('nullソケットでも動作する', () => {
      expect(() => getProjectHistory(null, '/test/project')).not.toThrow();
    });
  });

  describe('getProjectHistoryDetailed', () => {
    it('プロジェクト履歴詳細取得イベントを送信する', () => {
      const projectPath = '/test/project';
      
      getProjectHistoryDetailed(mockSocket, projectPath);

      expect(mockSocket.emit).toHaveBeenCalledWith('q:history:detailed', { projectPath });
    });
  });

  describe('getAllProjectsHistory', () => {
    it('接続されたソケットで全プロジェクト履歴を取得する', async () => {
      const promise = getAllProjectsHistory(mockSocket);

      // 成功レスポンスをシミュレート
      const successCallback = mockSocket.once.mock.calls.find(call => call[0] === 'q:history:list')[1];
      successCallback();

      await expect(promise).resolves.toBeUndefined();
      expect(mockSocket.emit).toHaveBeenCalledWith('q:projects');
    });

    it('未接続のソケットでエラーを返す', async () => {
      mockSocket.connected = false;
      
      await expect(getAllProjectsHistory(mockSocket)).rejects.toThrow('WebSocket not connected');
    });

    it('nullソケットでエラーを返す', async () => {
      await expect(getAllProjectsHistory(null)).rejects.toThrow('WebSocket not connected');
    });

    it('タイムアウトでエラーを返す', async () => {
      jest.useFakeTimers();
      
      const promise = getAllProjectsHistory(mockSocket);
      
      // タイムアウトを発生させる
      jest.advanceTimersByTime(10000);
      
      await expect(promise).rejects.toThrow('履歴取得がタイムアウトしました');
      
      jest.useRealTimers();
    });
  });
});