import { vi } from 'vitest';
import type { Socket } from 'socket.io-client';

import { sendQMessage, abortQSession } from '../chat';

describe('Chat Functions', () => {
  let mockSocket: Partial<Socket>;

  beforeEach(() => {
    mockSocket = {
      emit: vi.fn(),
      connected: true,
    } as Partial<Socket>;
  });

  describe('sendQMessage', () => {
    it('接続されたソケットでメッセージを送信する', async () => {
      const sessionId = 'test-session-123';
      const message = 'Hello, Amazon Q!';

      await sendQMessage(mockSocket as Socket, sessionId, message);

      expect(mockSocket.emit).toHaveBeenCalledWith('q:message', {
        sessionId,
        message,
      });
    });

    it('未接続のソケットでエラーを返す', async () => {
      mockSocket.connected = false;

      await expect(sendQMessage(mockSocket as Socket, 'session', 'message')).rejects.toThrow(
        'WebSocket not connected'
      );
    });

    it('nullソケットでエラーを返す', async () => {
      await expect(sendQMessage(null, 'session', 'message')).rejects.toThrow(
        'WebSocket not connected'
      );
    });
  });

  describe('abortQSession', () => {
    it('セッション中止イベントを送信する', () => {
      const sessionId = 'test-session-123';

      abortQSession(mockSocket as Socket, sessionId);

      expect(mockSocket.emit).toHaveBeenCalledWith('q:abort', { sessionId });
    });

    it('nullソケットでも動作する', () => {
      expect(() => abortQSession(null, 'session-123')).not.toThrow();
    });
  });
});
