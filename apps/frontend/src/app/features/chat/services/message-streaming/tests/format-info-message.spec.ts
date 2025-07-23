import { describe, it, expect } from 'vitest';

import { formatInfoMessage } from '../format-info-message';

describe('formatInfoMessage', () => {
  it('空のメッセージをnullで返す', () => {
    const data = { sessionId: 'test-session', message: '', type: 'general' };
    const result = formatInfoMessage(data);
    expect(result).toBe(null);
  });

  it('空白のみのメッセージをnullで返す', () => {
    const data = { sessionId: 'test-session', message: '   ', type: 'general' };
    const result = formatInfoMessage(data);
    expect(result).toBe(null);
  });

  it('Unicode文字のみのメッセージをnullで返す', () => {
    const data = {
      sessionId: 'test-session',
      message: '⢠⣶⣶⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣶⣿⣿⣿⣶⣦⡀⠀',
      type: 'general',
    };
    const result = formatInfoMessage(data);
    expect(result).toBe(null);
  });

  it('Unicode装飾文字のみのメッセージをnullで返す', () => {
    const data = {
      sessionId: 'test-session',
      message: '⠀⠀⠀⣾⡿⢻⣿⡆⠀⠀⠀⢀⣄⡄⢀⣠⣤⣤⡀⢀⣠⣤⣤⡀⠀⠀⢀⣠⣤⣤⣤⣄⠀⠀⢀⣤⣤⣤⣤⣤⣤⡀⠀⠀⣀⣤⣤⣤⣀⠀⠀⠀⢠⣤⡀⣀⣤⣤⣄⡀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠀⠀⠀⣿⣿⡆',
      type: 'general',
    };
    const result = formatInfoMessage(data);
    expect(result).toBe(null);
  });

  it('Unicode文字とテキストが混在する場合はテキスト部分のみフォーマット', () => {
    const data = {
      sessionId: 'test-session',
      message: '⢠⣶ Hello Amazon Q ⣶⣦⠀',
      type: 'general',
    };
    const result = formatInfoMessage(data);
    expect(result).toBe('💬 Hello Amazon Q');
  });

  it('thinking系メッセージの処理', () => {
    const data = { sessionId: 'test-session', message: 'thinking', type: 'general' };
    const result = formatInfoMessage(data);
    expect(result).toBe('🤔 Thinking...');
  });

  it('thinking...メッセージの処理', () => {
    // 異なるセッションIDを使用して重複チェックに引っかからないようにする
    const data = { sessionId: 'different-session-id', message: 'thinking...', type: 'general' };
    const result = formatInfoMessage(data);
    expect(result).toBe('🤔 Thinking...');
  });

  it('重複するthinkingメッセージは2回目以降nullを返す', () => {
    const sessionId = 'duplicate-test-session';
    
    // 1回目: 正常に処理される
    const result1 = formatInfoMessage({ sessionId, message: 'thinking', type: 'general' });
    expect(result1).toBe('🤔 Thinking...');
    
    // 2回目: 1秒以内なので重複とみなされnullが返される
    const result2 = formatInfoMessage({ sessionId, message: 'thinking', type: 'general' });
    expect(result2).toBe(null);
  });

  it('異なるセッションのthinkingメッセージは重複判定されない', () => {
    const result1 = formatInfoMessage({ sessionId: 'session-1', message: 'thinking', type: 'general' });
    expect(result1).toBe('🤔 Thinking...');
    
    const result2 = formatInfoMessage({ sessionId: 'session-2', message: 'thinking', type: 'general' });
    expect(result2).toBe('🤔 Thinking...');
  });

  it('初期化タイプメッセージのフォーマット', () => {
    const data = { sessionId: 'test-session', message: 'Initializing...', type: 'initialization' };
    const result = formatInfoMessage(data);
    expect(result).toBe('ℹ️ Initializing...');
  });

  it('ステータスタイプメッセージのフォーマット', () => {
    const data = { sessionId: 'test-session', message: 'Ready', type: 'status' };
    const result = formatInfoMessage(data);
    expect(result).toBe('✅ Ready');
  });

  it('プログレスタイプメッセージのフォーマット', () => {
    const data = { sessionId: 'test-session', message: 'Processing...', type: 'progress' };
    const result = formatInfoMessage(data);
    expect(result).toBe('⏳ Processing...');
  });

  it('一般タイプメッセージのフォーマット', () => {
    const data = { sessionId: 'test-session', message: "Hello! I'm Amazon Q", type: 'general' };
    const result = formatInfoMessage(data);
    expect(result).toBe("💬 Hello! I'm Amazon Q");
  });

  it('タイプ未指定のメッセージのフォーマット', () => {
    const data = { sessionId: 'test-session', message: 'Default message' };
    const result = formatInfoMessage(data);
    expect(result).toBe('💬 Default message');
  });

  it('前後の空白をトリム', () => {
    const data = { sessionId: 'test-session', message: '  Hello World  ', type: 'general' };
    const result = formatInfoMessage(data);
    expect(result).toBe('💬 Hello World');
  });
});
