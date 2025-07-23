import { describe, it, expect } from 'vitest';

import type { QProcessSession } from '../../../../types';

// まだ実装されていない関数をテスト（TDD RED phase）
import { 
  shouldSendThinking, 
  resetThinkingFlag, 
  resetThinkingFlagForNewMessage 
} from '../../../../services/amazon-q-cli/message-handler/should-send-thinking';

describe('shouldSendThinking', () => {
  describe('初回のthinkingメッセージ', () => {
    it('thinking送信フラグがfalseの場合はtrueを返す', () => {
      const session: Partial<QProcessSession> = {
        hasThinkingSent: false,
      };
      
      const result = shouldSendThinking(session as QProcessSession, 'thinking');
      expect(result).toBe(true);
    });

    it('thinking送信後はフラグがtrueに更新される', () => {
      const session: Partial<QProcessSession> = {
        hasThinkingSent: false,
      };
      
      const result = shouldSendThinking(session as QProcessSession, 'thinking');
      expect(result).toBe(true);
      expect(session.hasThinkingSent).toBe(true);
    });
  });

  describe('2回目以降のthinkingメッセージ', () => {
    it('thinking送信フラグがtrueの場合はfalseを返す', () => {
      const session: Partial<QProcessSession> = {
        hasThinkingSent: true,
      };
      
      const result = shouldSendThinking(session as QProcessSession, 'thinking');
      expect(result).toBe(false);
    });

    it('既に送信済みの場合はフラグは変更されない', () => {
      const session: Partial<QProcessSession> = {
        hasThinkingSent: true,
      };
      
      const result = shouldSendThinking(session as QProcessSession, 'thinking');
      expect(result).toBe(false);
      expect(session.hasThinkingSent).toBe(true);
    });
  });

  describe('プロンプト表示後のリセット', () => {
    it('resetThinkingFlag関数でフラグがリセットされる', () => {
      const session: Partial<QProcessSession> = {
        hasThinkingSent: true,
      };
      
      resetThinkingFlag(session as QProcessSession);
      
      expect(session.hasThinkingSent).toBe(false);
    });
  });

  describe('新規メッセージ送信時のリセット', () => {
    it('新しいメッセージ送信時にフラグがリセットされる', () => {
      const session: Partial<QProcessSession> = {
        hasThinkingSent: true,
      };
      
      resetThinkingFlagForNewMessage(session as QProcessSession);
      
      expect(session.hasThinkingSent).toBe(false);
    });
  });
});