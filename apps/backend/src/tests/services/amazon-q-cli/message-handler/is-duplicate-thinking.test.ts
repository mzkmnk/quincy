import { describe, it, expect, beforeEach } from 'vitest';

import { isDuplicateThinking } from '../../../../services/amazon-q-cli/message-handler/is-duplicate-thinking';
import type { QProcessSession } from '../../../../types';

describe('isDuplicateThinking', () => {
  let mockSession: QProcessSession;

  beforeEach(() => {
    // モックセッションを初期化
    mockSession = {
      sessionId: 'q_session_test',
      lastThinkingMessage: '',
      lastInfoMessageTime: 0,
      hasThinkingSent: false,
      // その他の必須フィールドをモック値で埋める
      process: {} as any,
      workingDir: '/test',
      startTime: Date.now(),
      status: 'running',
      lastActivity: Date.now(),
      command: 'test',
      options: {} as any,
      outputBuffer: '',
      errorBuffer: '',
      bufferFlushCount: 0,
      incompleteOutputLine: '',
      incompleteErrorLine: '',
      lastInfoMessage: '',
      initializationBuffer: [],
      initializationPhase: false,
      currentTools: [],
      toolBuffer: '',
      toolDetectionBuffer: {} as any,
    };
  });

  describe('非thinkingメッセージの場合', () => {
    it('通常のメッセージは重複判定しない', () => {
      const result = isDuplicateThinking('normal message', mockSession);
      expect(result).toBe(false);
    });

    it('空のメッセージは重複判定しない', () => {
      const result = isDuplicateThinking('', mockSession);
      expect(result).toBe(false);
    });
  });

  describe('thinkingメッセージの場合', () => {
    it('初回のthinkingメッセージは重複していない', () => {
      const result = isDuplicateThinking('thinking', mockSession);
      expect(result).toBe(false);
      // lastThinkingMessageの更新はshouldSendThinkingで行うため、ここでは更新されない
    });

    it('thinking...の初回メッセージは重複していない', () => {
      const result = isDuplicateThinking('thinking...', mockSession);
      expect(result).toBe(false);
      // lastThinkingMessageの更新はshouldSendThinkingで行うため、ここでは更新されない
    });

    it('同じthinkingメッセージが1秒以内に来た場合は重複と判定', () => {
      const now = Date.now();
      mockSession.lastThinkingMessage = 'thinking';
      mockSession.lastInfoMessageTime = now - 500; // 500ms前
      
      // Date.nowをモック
      const originalNow = Date.now;
      Date.now = () => now;
      
      const result = isDuplicateThinking('thinking', mockSession);
      expect(result).toBe(true);
      
      // Date.nowを復元
      Date.now = originalNow;
    });

    it('同じthinkingメッセージでも1秒以上経過している場合は重複でない', () => {
      const now = Date.now();
      mockSession.lastThinkingMessage = 'thinking';
      mockSession.lastInfoMessageTime = now - 1500; // 1.5秒前
      
      // Date.nowをモック
      const originalNow = Date.now;
      Date.now = () => now;
      
      const result = isDuplicateThinking('thinking', mockSession);
      expect(result).toBe(false);
      expect(mockSession.lastThinkingMessage).toBe('thinking');
      
      // Date.nowを復元
      Date.now = originalNow;
    });

    it('異なるthinkingメッセージの場合は重複でない', () => {
      const now = Date.now();
      mockSession.lastThinkingMessage = 'thinking';
      mockSession.lastInfoMessageTime = now - 100; // 100ms前
      
      // Date.nowをモック
      const originalNow = Date.now;
      Date.now = () => now;
      
      const result = isDuplicateThinking('thinking...', mockSession);
      expect(result).toBe(false);
      // lastThinkingMessageの更新はshouldSendThinkingで行うため、変更されない
      
      // Date.nowを復元
      Date.now = originalNow;
    });
  });

  describe('大文字小文字とパターンマッチング', () => {
    it('大文字のThinkingも正しく検出', () => {
      const result = isDuplicateThinking('Thinking', mockSession);
      expect(result).toBe(false);
      // lastThinkingMessageの更新はshouldSendThinkingで行うため、変更されない
    });

    it('混合大文字のThInKiNgも正しく検出', () => {
      const result = isDuplicateThinking('ThInKiNg', mockSession);
      expect(result).toBe(false);
      // lastThinkingMessageの更新はshouldSendThinkingで行うため、変更されない
    });

    it('ドット数が異なるパターンも検出', () => {
      const result = isDuplicateThinking('thinking....', mockSession);
      expect(result).toBe(false);
      // lastThinkingMessageの更新はshouldSendThinkingで行うため、変更されない
    });
  });

  describe('トリムとスペース処理', () => {
    it('前後にスペースがあるthinkingメッセージも正しく処理', () => {
      const result = isDuplicateThinking('  thinking  ', mockSession);
      expect(result).toBe(false);
      // lastThinkingMessageの更新はshouldSendThinkingで行うため、変更されない
    });

    it('タブやその他の空白文字も正しく処理', () => {
      const result = isDuplicateThinking('\t\nthinking...\t\n', mockSession);
      expect(result).toBe(false);
      // lastThinkingMessageの更新はshouldSendThinkingで行うため、変更されない
    });
  });
});