import type { DisplayMessage } from '@quincy/shared';

import { convertDisplayMessageToChatMessage } from '../display-message-converter';

describe('convertDisplayMessageToChatMessage', () => {
  it('userタイプのDisplayMessageを正しく変換する', () => {
    const displayMessage: DisplayMessage = {
      id: 'msg123',
      type: 'user',
      content: 'Hello',
      timestamp: new Date(1234567890000),
    };

    const result = convertDisplayMessageToChatMessage(displayMessage);

    expect(result).toEqual({
      id: 'msg123',
      content: 'Hello',
      sender: 'user',
      timestamp: new Date(1234567890000),
      isTyping: false,
    });
  });

  it('assistantタイプのDisplayMessageを正しく変換する', () => {
    const displayMessage: DisplayMessage = {
      id: 'msg456',
      type: 'assistant',
      content: 'Hi there!',
      timestamp: new Date(1234567890000),
    };

    const result = convertDisplayMessageToChatMessage(displayMessage);

    expect(result).toEqual({
      id: 'msg456',
      content: 'Hi there!',
      sender: 'assistant',
      timestamp: new Date(1234567890000),
      isTyping: false,
    });
  });

  it('thinkingタイプのDisplayMessageをisTyping=trueで変換する', () => {
    const displayMessage: DisplayMessage = {
      id: 'msg789',
      type: 'thinking',
      content: 'Processing...',
      timestamp: new Date(1234567890000),
    };

    const result = convertDisplayMessageToChatMessage(displayMessage);

    expect(result).toEqual({
      id: 'msg789',
      content: 'Processing...',
      sender: 'assistant',
      timestamp: new Date(1234567890000),
      isTyping: true,
    });
  });

  it('timestampがない場合、現在時刻を使用する', () => {
    const now = Date.now();
    const displayMessage: DisplayMessage = {
      id: 'msg000',
      type: 'user',
      content: 'No timestamp',
    };

    const result = convertDisplayMessageToChatMessage(displayMessage);

    expect(result.id).toBe('msg000');
    expect(result.content).toBe('No timestamp');
    expect(result.sender).toBe('user');
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(now);
    expect(result.isTyping).toBe(false);
  });
});
