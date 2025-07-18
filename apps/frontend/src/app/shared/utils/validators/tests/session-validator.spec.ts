import { isValidSessionId } from '../session-validator';

describe('isValidSessionId', () => {
  it('有効なセッションIDの場合、trueを返す', () => {
    expect(isValidSessionId('q_session_abc123')).toBe(true);
    expect(isValidSessionId('q_session_ABC123')).toBe(true);
    expect(isValidSessionId('q_session_a1B2c3')).toBe(true);
    expect(isValidSessionId('q_session_123456789')).toBe(true);
  });

  it('無効なセッションIDの場合、falseを返す', () => {
    // プレフィックスが間違っている
    expect(isValidSessionId('session_abc123')).toBe(false);
    expect(isValidSessionId('q_abc123')).toBe(false);
    expect(isValidSessionId('q_sess_abc123')).toBe(false);
    
    // 特殊文字を含む
    expect(isValidSessionId('q_session_abc-123')).toBe(false);
    expect(isValidSessionId('q_session_abc_123')).toBe(false);
    expect(isValidSessionId('q_session_abc@123')).toBe(false);
    
    // 空文字やnull
    expect(isValidSessionId('')).toBe(false);
    expect(isValidSessionId('q_session_')).toBe(false);
    
    // 完全に異なる形式
    expect(isValidSessionId('invalid')).toBe(false);
    expect(isValidSessionId('123456')).toBe(false);
  });
});