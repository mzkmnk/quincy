import { describe, it, expect, beforeEach } from 'vitest';

import { ChatStateManager } from '../../../../services/amazon-q-cli/realtime-chat/chat-state-manager';

describe('ChatStateManager', () => {
  let manager: ChatStateManager;

  beforeEach(() => {
    manager = new ChatStateManager();
  });

  describe('state transitions', () => {
    it('初期状態はidleである', () => {
      expect(manager.getState()).toBe('idle');
    });

    it('idle -> thinking に遷移できる', () => {
      manager.startThinking();
      expect(manager.getState()).toBe('thinking');
    });

    it('thinking -> responding に遷移できる', () => {
      manager.startThinking();
      manager.startResponding();
      expect(manager.getState()).toBe('responding');
    });

    it('responding -> idle に遷移できる', () => {
      manager.startThinking();
      manager.startResponding();
      manager.completeResponse();
      expect(manager.getState()).toBe('idle');
    });

    it('任意の状態からidleに遷移できる（リセット）', () => {
      manager.startThinking();
      manager.reset();
      expect(manager.getState()).toBe('idle');

      manager.startThinking();
      manager.startResponding();
      manager.reset();
      expect(manager.getState()).toBe('idle');
    });
  });

  describe('invalid transitions', () => {
    it('idle -> responding は許可されない', () => {
      expect(() => {
        manager.startResponding();
      }).toThrow('Invalid state transition: idle -> responding');
    });

    it('responding -> thinking は許可されない', () => {
      manager.startThinking();
      manager.startResponding();

      expect(() => {
        manager.startThinking();
      }).toThrow('Invalid state transition: responding -> thinking');
    });

    it('idle -> complete は許可されない', () => {
      expect(() => {
        manager.completeResponse();
      }).toThrow('Invalid state transition: idle -> idle');
    });
  });

  describe('canTransitionTo', () => {
    it('有効な遷移を判定できる', () => {
      expect(manager.canTransitionTo('thinking')).toBe(true);
      expect(manager.canTransitionTo('responding')).toBe(false);

      manager.startThinking();
      expect(manager.canTransitionTo('responding')).toBe(true);
      expect(manager.canTransitionTo('idle')).toBe(true);
      expect(manager.canTransitionTo('thinking')).toBe(false);
    });
  });

  describe('timing information', () => {
    it('thinking開始時刻を記録する', () => {
      const before = Date.now();
      manager.startThinking();
      const after = Date.now();

      const thinkingStartTime = manager.getThinkingStartTime();
      expect(thinkingStartTime).toBeGreaterThanOrEqual(before);
      expect(thinkingStartTime).toBeLessThanOrEqual(after);
    });

    it('responding開始時刻を記録する', () => {
      manager.startThinking();

      const before = Date.now();
      manager.startResponding();
      const after = Date.now();

      const respondingStartTime = manager.getRespondingStartTime();
      expect(respondingStartTime).toBeGreaterThanOrEqual(before);
      expect(respondingStartTime).toBeLessThanOrEqual(after);
    });

    it('thinking時間を計算できる', () => {
      manager.startThinking();

      // 少し待つ
      const waitTime = 100;
      const start = Date.now();
      while (Date.now() - start < waitTime) {
        // busy wait
      }

      manager.startResponding();

      const thinkingDuration = manager.getThinkingDuration();
      expect(thinkingDuration).toBeGreaterThanOrEqual(waitTime - 10); // 誤差を考慮
      expect(thinkingDuration).toBeLessThan(waitTime + 50);
    });

    it('リセット時にタイミング情報もクリアされる', () => {
      manager.startThinking();
      manager.startResponding();

      manager.reset();

      expect(manager.getThinkingStartTime()).toBe(0);
      expect(manager.getRespondingStartTime()).toBe(0);
      expect(manager.getThinkingDuration()).toBe(0);
    });
  });

  describe('state helpers', () => {
    it('isThinking', () => {
      expect(manager.isThinking()).toBe(false);

      manager.startThinking();
      expect(manager.isThinking()).toBe(true);

      manager.startResponding();
      expect(manager.isThinking()).toBe(false);
    });

    it('isResponding', () => {
      expect(manager.isResponding()).toBe(false);

      manager.startThinking();
      expect(manager.isResponding()).toBe(false);

      manager.startResponding();
      expect(manager.isResponding()).toBe(true);

      manager.completeResponse();
      expect(manager.isResponding()).toBe(false);
    });

    it('isIdle', () => {
      expect(manager.isIdle()).toBe(true);

      manager.startThinking();
      expect(manager.isIdle()).toBe(false);

      manager.reset();
      expect(manager.isIdle()).toBe(true);
    });
  });

  describe('getStateInfo', () => {
    it('完全な状態情報を取得できる', () => {
      const info = manager.getStateInfo();

      expect(info).toEqual({
        state: 'idle',
        thinkingStartTime: 0,
        respondingStartTime: 0,
        thinkingDuration: 0,
      });
    });

    it('thinking中の状態情報', () => {
      manager.startThinking();
      const info = manager.getStateInfo();

      expect(info.state).toBe('thinking');
      expect(info.thinkingStartTime).toBeGreaterThan(0);
      expect(info.respondingStartTime).toBe(0);
      expect(info.thinkingDuration).toBe(0);
    });

    it('responding中の状態情報', async () => {
      manager.startThinking();
      // 十分な待機時間を追加してthinkingDurationを確実に測定
      await new Promise(resolve => setTimeout(resolve, 10));
      manager.startResponding();
      const info = manager.getStateInfo();

      expect(info.state).toBe('responding');
      expect(info.thinkingStartTime).toBeGreaterThan(0);
      expect(info.respondingStartTime).toBeGreaterThan(0);
      expect(info.thinkingDuration).toBeGreaterThanOrEqual(5); // 最低5ms
    });
  });
});
