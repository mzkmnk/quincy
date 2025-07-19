import type { DisplayMessage } from '@quincy/shared';

import { convertDisplayMessagesToChatMessages } from '../chat-message-converter';

describe('convertDisplayMessagesToChatMessages', () => {
  it('DisplayMessage配列を正しくChatMessage配列に変換する', () => {
    const displayMessages: DisplayMessage[] = [
      {
        id: 'msg1',
        type: 'user',
        content: 'First message',
        timestamp: new Date(1000000000000)
      },
      {
        id: 'msg2',
        type: 'assistant',
        content: 'Second message',
        timestamp: new Date(1000000001000)
      },
      {
        id: 'msg3',
        type: 'thinking',
        content: 'Thinking...',
        timestamp: new Date(1000000002000)
      }
    ];

    const result = convertDisplayMessagesToChatMessages(displayMessages);

    expect(result).toHaveLength(3);
    
    expect(result[0]).toEqual({
      id: 'msg1',
      content: 'First message',
      sender: 'user',
      timestamp: new Date(1000000000000),
      isTyping: false
    });

    expect(result[1]).toEqual({
      id: 'msg2',
      content: 'Second message',
      sender: 'assistant',
      timestamp: new Date(1000000001000),
      isTyping: false
    });

    expect(result[2]).toEqual({
      id: 'msg3',
      content: 'Thinking...',
      sender: 'assistant',
      timestamp: new Date(1000000002000),
      isTyping: true
    });
  });

  it('空の配列を処理できる', () => {
    const result = convertDisplayMessagesToChatMessages([]);
    expect(result).toEqual([]);
  });

  it('timestampがないメッセージも処理できる', () => {
    const displayMessages: DisplayMessage[] = [
      {
        id: 'msg1',
        type: 'user',
        content: 'No timestamp'
      }
    ];

    const result = convertDisplayMessagesToChatMessages(displayMessages);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('msg1');
    expect(result[0].timestamp).toBeInstanceOf(Date);
  });
});