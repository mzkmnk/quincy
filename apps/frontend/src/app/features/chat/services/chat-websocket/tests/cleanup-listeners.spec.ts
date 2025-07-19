import { cleanupChatWebSocketListeners } from '../cleanup-listeners';
import type { WebSocketService } from '../../../../../core/services/websocket.service';

describe('cleanupChatWebSocketListeners', () => {
  it('WebSocketサービスのクリーンアップリスナーを呼び出す', () => {
    const mockWebSocketService = {
      removeChatListeners: vi.fn(),
    } as unknown as WebSocketService;

    cleanupChatWebSocketListeners(mockWebSocketService);

    expect(mockWebSocketService.removeChatListeners).toHaveBeenCalled();
  });
});
