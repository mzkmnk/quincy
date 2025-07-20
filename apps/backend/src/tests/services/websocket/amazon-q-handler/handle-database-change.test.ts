import { describe, it, expect, beforeEach, vi } from 'vitest';

import { handleDatabaseChangeNotification } from '../../../../services/websocket/amazon-q-handler/handle-database-change';
import type { DatabaseChangeEvent } from '../../../../types/database-watcher';

interface MockIo {
  emit: ReturnType<typeof vi.fn>;
  to: ReturnType<typeof vi.fn>;
}

describe('Handle Database Change WebSocket Handler', () => {
  let mockIo: MockIo;

  beforeEach(() => {
    mockIo = {
      emit: vi.fn(),
      to: vi.fn().mockReturnValue({
        emit: vi.fn(),
      }),
    };
  });

  describe('handleDatabaseChangeNotification', () => {
    it('should emit database change notification to all connected clients', () => {
      const changeData = {
        filePath: '/path/to/database.sqlite3',
        timestamp: new Date(),
        changeType: 'modified' as const,
      };

      handleDatabaseChangeNotification(mockIo, changeData);

      expect(mockIo.emit).toHaveBeenCalledWith('database-changed', changeData);
    });

    it('should include correct event data structure', () => {
      const changeData = {
        filePath: '/Users/test/amazon-q/data.sqlite3',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        changeType: 'add' as const,
      };

      handleDatabaseChangeNotification(mockIo, changeData);

      expect(mockIo.emit).toHaveBeenCalledWith('database-changed', {
        filePath: '/Users/test/amazon-q/data.sqlite3',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        changeType: 'add',
      });
    });

    it('should handle different change types', () => {
      const testCases = [
        { changeType: 'add' as const },
        { changeType: 'modified' as const },
        { changeType: 'deleted' as const },
      ];

      testCases.forEach(({ changeType }) => {
        const changeData = {
          filePath: '/path/to/test.sqlite3',
          timestamp: new Date(),
          changeType,
        };

        handleDatabaseChangeNotification(mockIo, changeData);

        expect(mockIo.emit).toHaveBeenCalledWith(
          'database-changed',
          expect.objectContaining({ changeType })
        );
      });
    });

    it('should handle empty file path gracefully', () => {
      const changeData = {
        filePath: '',
        timestamp: new Date(),
        changeType: 'modified' as const,
      };

      expect(() => {
        handleDatabaseChangeNotification(mockIo, changeData);
      }).not.toThrow();

      expect(mockIo.emit).toHaveBeenCalledWith('database-changed', changeData);
    });

    it('should preserve timestamp precision', () => {
      const exactTimestamp = new Date('2024-01-01T10:30:45.123Z');
      const changeData = {
        filePath: '/path/to/database.sqlite3',
        timestamp: exactTimestamp,
        changeType: 'modified' as const,
      };

      handleDatabaseChangeNotification(mockIo, changeData);

      const emittedData = mockIo.emit.mock.calls[0][1];
      expect(emittedData.timestamp).toEqual(exactTimestamp);
      expect(emittedData.timestamp.getTime()).toBe(exactTimestamp.getTime());
    });
  });

  describe('error handling', () => {
    it('should handle null io parameter gracefully', () => {
      const changeData = {
        filePath: '/path/to/database.sqlite3',
        timestamp: new Date(),
        changeType: 'modified' as const,
      };

      expect(() => {
        handleDatabaseChangeNotification(null, changeData);
      }).not.toThrow();
    });

    it('should handle undefined change data gracefully', () => {
      expect(() => {
        handleDatabaseChangeNotification(mockIo, undefined as unknown as DatabaseChangeEvent);
      }).not.toThrow();
    });

    it('should handle malformed change data', () => {
      const malformedData = {
        filePath: 123,
        timestamp: 'invalid-date',
        changeType: 'unknown',
      } as unknown as DatabaseChangeEvent;

      expect(() => {
        handleDatabaseChangeNotification(mockIo, malformedData);
      }).not.toThrow();

      expect(mockIo.emit).toHaveBeenCalledWith('database-changed', malformedData);
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple rapid notifications', () => {
      const changeData1 = {
        filePath: '/path/to/database1.sqlite3',
        timestamp: new Date(),
        changeType: 'add' as const,
      };

      const changeData2 = {
        filePath: '/path/to/database2.sqlite3',
        timestamp: new Date(),
        changeType: 'modified' as const,
      };

      handleDatabaseChangeNotification(mockIo, changeData1);
      handleDatabaseChangeNotification(mockIo, changeData2);

      expect(mockIo.emit).toHaveBeenCalledTimes(2);
      expect(mockIo.emit).toHaveBeenNthCalledWith(1, 'database-changed', changeData1);
      expect(mockIo.emit).toHaveBeenNthCalledWith(2, 'database-changed', changeData2);
    });

    it('should work with real-like file paths', () => {
      const realLikeData = {
        filePath: '/Users/username/.config/amazon-q/developer/data.sqlite3',
        timestamp: new Date(),
        changeType: 'modified' as const,
      };

      handleDatabaseChangeNotification(mockIo, realLikeData);

      expect(mockIo.emit).toHaveBeenCalledWith('database-changed', realLikeData);
    });
  });
});
