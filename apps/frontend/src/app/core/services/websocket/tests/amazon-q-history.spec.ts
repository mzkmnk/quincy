import { vi } from 'vitest';
import type { Socket } from 'socket.io-client';

import {
  getProjectHistory,
  getAllProjectsHistory,
  getProjectHistoryDetailed,
} from '../amazon-q-history';

describe('Amazon Q History Functions', () => {
  let mockSocket: Partial<Socket>;

  beforeEach(() => {
    mockSocket = {
      emit: vi.fn(),
      once: vi.fn(),
      connected: true,
    } as Partial<Socket>;
  });

  describe('getProjectHistory', () => {
    it('プロジェクト履歴取得イベントを送信する', () => {
      const projectPath = '/test/project';

      getProjectHistory(mockSocket as Socket, projectPath);

      expect(mockSocket.emit).toHaveBeenCalledWith('q:history', { projectPath });
    });

    it('nullソケットでも動作する', () => {
      expect(() => getProjectHistory(null, '/test/project')).not.toThrow();
    });
  });

  describe('getProjectHistoryDetailed', () => {
    it('プロジェクト履歴詳細取得イベントを送信する', () => {
      const projectPath = '/test/project';

      getProjectHistoryDetailed(mockSocket as Socket, projectPath);

      expect(mockSocket.emit).toHaveBeenCalledWith('q:history:detailed', { projectPath });
    });
  });

  describe('getAllProjectsHistory', () => {
    it('接続されたソケットで全プロジェクト履歴を取得する', async () => {
      const promise = getAllProjectsHistory(mockSocket as Socket);

      // 成功レスポンスをシミュレート
      // モック関数の呼び出しをシミュレート
      const onceCalls = (mockSocket.once as unknown as { mock: { calls: [string, () => void][] } }).mock.calls;
      const successCallback = onceCalls.find(call => call[0] === 'q:history:list')![1];
      successCallback();

      await expect(promise).resolves.toBeUndefined();
      expect(mockSocket.emit).toHaveBeenCalledWith('q:projects', undefined);
    });

    it('未接続のソケットでエラーを返す', async () => {
      mockSocket.connected = false;

      await expect(getAllProjectsHistory(mockSocket as Socket)).rejects.toThrow('WebSocket not connected');
    });

    it('nullソケットでエラーを返す', async () => {
      await expect(getAllProjectsHistory(null)).rejects.toThrow('WebSocket not connected');
    });

    it('タイムアウトでエラーを返す', async () => {
      vi.useFakeTimers();

      const promise = getAllProjectsHistory(mockSocket as Socket);

      // タイムアウトを発生させる
      vi.advanceTimersByTime(10000);

      await expect(promise).rejects.toThrow('履歴取得がタイムアウトしました');

      vi.useRealTimers();
    });
  });
});
