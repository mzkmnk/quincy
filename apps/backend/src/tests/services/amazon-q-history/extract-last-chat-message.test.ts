import { describe, it, expect } from 'vitest';

import { extractLastChatMessage } from '../../../services/amazon-q-history/extract-last-chat-message';
import type { AmazonQConversationWithHistory } from '../../../services/amazon-q-history-types';

describe('Extract Last Chat Message', () => {
  describe('extractLastChatMessage', () => {
    it('should extract the last chat message from a conversation with single turn', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv1',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn1',
            user_message: {
              message: 'Hello, how are you?',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: 'I am doing well, thank you for asking!',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
        ],
      };

      const result = extractLastChatMessage(conversation);

      expect(result).toEqual({
        userMessage: 'Hello, how are you?',
        aiResponse: 'I am doing well, thank you for asking!',
        timestamp: '2024-01-01T10:01:00Z',
        turnId: 'turn1',
      });
    });

    it('should extract the last chat message from a conversation with multiple turns', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv2',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn1',
            user_message: {
              message: 'First message',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: 'First response',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
          {
            turn_id: 'turn2',
            user_message: {
              message: 'Second message',
              timestamp: '2024-01-01T10:02:00Z',
            },
            ai_response: {
              message: 'Second response',
              timestamp: '2024-01-01T10:03:00Z',
            },
          },
          {
            turn_id: 'turn3',
            user_message: {
              message: 'Latest message',
              timestamp: '2024-01-01T10:04:00Z',
            },
            ai_response: {
              message: 'Latest response',
              timestamp: '2024-01-01T10:05:00Z',
            },
          },
        ],
      };

      const result = extractLastChatMessage(conversation);

      expect(result).toEqual({
        userMessage: 'Latest message',
        aiResponse: 'Latest response',
        timestamp: '2024-01-01T10:05:00Z',
        turnId: 'turn3',
      });
    });

    it('should return null for conversation with no history', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv_no_history',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: null,
      };

      const result = extractLastChatMessage(conversation);

      expect(result).toBeNull();
    });

    it('should return null for conversation with empty history array', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv_empty',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [],
      };

      const result = extractLastChatMessage(conversation);

      expect(result).toBeNull();
    });

    it('should handle missing user message gracefully', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv_no_user',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn1',
            user_message: null as unknown as {
              message: string;
              timestamp: string;
            },
            ai_response: {
              message: 'AI response without user message',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
        ],
      };

      const result = extractLastChatMessage(conversation);

      expect(result).toEqual({
        userMessage: '',
        aiResponse: 'AI response without user message',
        timestamp: '2024-01-01T10:01:00Z',
        turnId: 'turn1',
      });
    });

    it('should handle missing AI response gracefully', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv_no_ai',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn1',
            user_message: {
              message: 'User message without AI response',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: null as unknown as {
              message: string;
              timestamp: string;
            },
          },
        ],
      };

      const result = extractLastChatMessage(conversation);

      expect(result).toEqual({
        userMessage: 'User message without AI response',
        aiResponse: '',
        timestamp: '2024-01-01T10:00:00Z',
        turnId: 'turn1',
      });
    });

    it('should handle empty message strings', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv_empty_strings',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_empty',
            user_message: {
              message: '',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: '',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
        ],
      };

      const result = extractLastChatMessage(conversation);

      expect(result).toEqual({
        userMessage: '',
        aiResponse: '',
        timestamp: '2024-01-01T10:01:00Z',
        turnId: 'turn_empty',
      });
    });

    it('should handle missing turn_id gracefully', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv_no_turn_id',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: undefined as unknown as string,
            user_message: {
              message: 'Message without turn ID',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: 'Response without turn ID',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
        ],
      };

      const result = extractLastChatMessage(conversation);

      expect(result).toEqual({
        userMessage: 'Message without turn ID',
        aiResponse: 'Response without turn ID',
        timestamp: '2024-01-01T10:01:00Z',
        turnId: '',
      });
    });

    it('should handle missing timestamps gracefully', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv_no_timestamp',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_no_timestamp',
            user_message: {
              message: 'Message without timestamp',
              timestamp: undefined as unknown as string,
            },
            ai_response: {
              message: 'Response without timestamp',
              timestamp: undefined as unknown as string,
            },
          },
        ],
      };

      const result = extractLastChatMessage(conversation);

      expect(result).toEqual({
        userMessage: 'Message without timestamp',
        aiResponse: 'Response without timestamp',
        timestamp: '',
        turnId: 'turn_no_timestamp',
      });
    });

    it('should handle malformed turn structure gracefully', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv_malformed',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          null as unknown as {
            turn_id: string;
            user_message: { message: string; timestamp: string };
            ai_response: { message: string; timestamp: string };
          },
          undefined as unknown as {
            turn_id: string;
            user_message: { message: string; timestamp: string };
            ai_response: { message: string; timestamp: string };
          },
          {
            turn_id: 'valid_turn',
            user_message: {
              message: 'Valid message',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: 'Valid response',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
        ],
      };

      const result = extractLastChatMessage(conversation);

      expect(result).toEqual({
        userMessage: 'Valid message',
        aiResponse: 'Valid response',
        timestamp: '2024-01-01T10:01:00Z',
        turnId: 'valid_turn',
      });
    });

    it('should prioritize AI response timestamp when available', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv_priority_test',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_priority',
            user_message: {
              message: 'User message',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: 'AI response',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
        ],
      };

      const result = extractLastChatMessage(conversation);

      // AI応答のタイムスタンプが優先される
      expect(result?.timestamp).toBe('2024-01-01T10:01:00Z');
    });

    it('should fallback to user timestamp when AI timestamp is missing', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv_fallback_test',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_fallback',
            user_message: {
              message: 'User message',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: 'AI response',
              timestamp: undefined as unknown as string,
            },
          },
        ],
      };

      const result = extractLastChatMessage(conversation);

      // ユーザーメッセージのタイムスタンプにフォールバック
      expect(result?.timestamp).toBe('2024-01-01T10:00:00Z');
    });

    it('should handle conversations with only incomplete turns', () => {
      const conversation: AmazonQConversationWithHistory = {
        conversation_id: 'conv_incomplete',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          null as unknown as {
            turn_id: string;
            user_message: { message: string; timestamp: string };
            ai_response: { message: string; timestamp: string };
          },
          {} as unknown as {
            turn_id: string;
            user_message: { message: string; timestamp: string };
            ai_response: { message: string; timestamp: string };
          },
          { turn_id: 'incomplete' } as unknown as {
            turn_id: string;
            user_message: { message: string; timestamp: string };
            ai_response: { message: string; timestamp: string };
          },
        ],
      };

      const result = extractLastChatMessage(conversation);

      expect(result).toBeNull();
    });
  });
});
