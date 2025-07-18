import { vi } from 'vitest';
import { connect, disconnect, emit, on, off } from '../connection';
import { signal } from '@angular/core';
import { ConnectionState } from '../types';

// Socket.ioのモック
const mockIo = vi.fn();
vi.mock('socket.io-client', () => ({
  io: mockIo
}));

describe('WebSocket Connection Functions', () => {
  let connectionState: any;
  let mockSocket: any;

  beforeEach(() => {
    connectionState = signal<ConnectionState>({
      connected: false,
      connecting: false,
      error: null
    });

    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connected: true
    };

    // Reset mock before each test
    vi.clearAllMocks();
    mockIo.mockReturnValue(mockSocket);
  });

  describe('connect', () => {
    it('Socket.io接続を作成し、接続状態を更新する', () => {
      const socket = connect('http://localhost:3000', connectionState);

      expect(socket).toBeDefined();
      expect(connectionState().connecting).toBe(true);
      expect(connectionState().connected).toBe(false);
      expect(connectionState().error).toBeNull();
    });
  });

  describe('disconnect', () => {
    it('ソケットを切断し、接続状態をリセットする', () => {
      disconnect(mockSocket, connectionState);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(connectionState().connected).toBe(false);
      expect(connectionState().connecting).toBe(false);
      expect(connectionState().error).toBeNull();
    });

    it('nullソケットでもエラーなく動作する', () => {
      expect(() => disconnect(null, connectionState)).not.toThrow();
      expect(connectionState().connected).toBe(false);
    });
  });

  describe('emit', () => {
    it('接続されているソケットでイベントを送信する', () => {
      const testData = { message: 'test' };
      
      emit(mockSocket, 'test-event', testData);

      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', testData);
    });

    it('接続されていないソケットでは何もしない', () => {
      mockSocket.connected = false;
      
      emit(mockSocket, 'test-event', {});

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('nullソケットでは何もしない', () => {
      expect(() => emit(null, 'test-event', {})).not.toThrow();
    });
  });

  describe('on', () => {
    it('イベントリスナーを設定する', () => {
      const callback = vi.fn();
      
      on(mockSocket, 'test-event', callback);

      expect(mockSocket.on).toHaveBeenCalledWith('test-event', callback);
    });

    it('nullソケットでは何もしない', () => {
      expect(() => on(null, 'test-event', vi.fn())).not.toThrow();
    });
  });

  describe('off', () => {
    it('イベントリスナーを削除する', () => {
      const callback = vi.fn();
      
      off(mockSocket, 'test-event', callback);

      expect(mockSocket.off).toHaveBeenCalledWith('test-event', callback);
    });

    it('nullソケットでは何もしない', () => {
      expect(() => off(null, 'test-event', vi.fn())).not.toThrow();
    });
  });
});