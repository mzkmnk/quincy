import { setupChatWebSocketListeners } from '../setup-listeners';
import type { WebSocketService } from '../../../../../core/services/websocket.service';

describe('setupChatWebSocketListeners', () => {
  it('WebSocketサービスのセットアップリスナーを呼び出す', () => {
    const mockWebSocketService = {
      setupChatListeners: vi.fn(),
    } as unknown as WebSocketService;

    const mockHandlers = {
      onQResponse: vi.fn(),
      onQError: vi.fn(),
      onQInfo: vi.fn(),
      onQCompletion: vi.fn(),
    };
    setupChatWebSocketListeners(mockWebSocketService, mockHandlers);

    expect(mockWebSocketService.setupChatListeners).toHaveBeenCalled();
  });
});