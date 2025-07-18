import { formatInfoMessage } from '../info-message-formatter';

describe('formatInfoMessage', () => {
  it('info タイプのメッセージをフォーマットする', () => {
    expect(formatInfoMessage('Information message', 'info')).toBe('ℹ️ Information message');
    expect(formatInfoMessage('Test', 'info')).toBe('ℹ️ Test');
  });

  it('warning タイプのメッセージをフォーマットする', () => {
    expect(formatInfoMessage('Warning message', 'warning')).toBe('⚠️ Warning message');
  });

  it('error タイプのメッセージをフォーマットする', () => {
    expect(formatInfoMessage('Error occurred', 'error')).toBe('❌ Error occurred');
  });

  it('success タイプのメッセージをフォーマットする', () => {
    expect(formatInfoMessage('Operation successful', 'success')).toBe('✅ Operation successful');
  });

  it('デフォルトは info タイプ', () => {
    expect(formatInfoMessage('Default message')).toBe('ℹ️ Default message');
  });

  it('前後の空白を適切に処理する', () => {
    expect(formatInfoMessage('  Trimmed  ', 'info')).toBe('ℹ️   Trimmed');
  });

  it('空のメッセージでも絵文字を表示', () => {
    expect(formatInfoMessage('', 'info')).toBe('ℹ️');
  });
});