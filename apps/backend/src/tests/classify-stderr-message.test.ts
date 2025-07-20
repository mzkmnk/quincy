/**
 * classify-stderr-message関数のテスト
 */

import { classifyStderrMessage } from '../services/amazon-q-cli/message-handler/classify-stderr-message';

describe('classify-stderr-message', () => {
  describe('classifyStderrMessage', () => {
    it('空文字列をスキップする', () => {
      expect(classifyStderrMessage('')).toBe('skip');
      expect(classifyStderrMessage('   ')).toBe('skip');
    });

    it('制御文字のみをスキップする', () => {
      expect(classifyStderrMessage('\x00\x01\x02')).toBe('skip');
      expect(classifyStderrMessage('\x08\x0B\x0C')).toBe('skip');
    });

    it('スピナー文字のみをスキップする', () => {
      expect(classifyStderrMessage('⠋')).toBe('skip');
      expect(classifyStderrMessage('⠙')).toBe('skip');
      expect(classifyStderrMessage(' ⠸ ')).toBe('skip');
    });

    it('実際のAmazon QのUnicode装飾文字をスキップする', () => {
      const input1 = '⢠⣶⣶⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣶⣿⣿⣿⣶⣦⡀⠀';
      expect(classifyStderrMessage(input1)).toBe('skip');
    });

    it('Unicode装飾文字2をスキップする', () => {
      const input2 = '⠀⠀⠀⣾⡿⢻⣿⡆⠀⠀⠀⢀⣄⡄⢀⣠⣤⣤⡀⢀⣠⣤⣤⡀⠀⠀⢀⣠⣤⣤⣤⣄⠀⠀⢀⣤⣤⣤⣤⣤⣤⡀⠀⠀⣀⣤⣤⣤⣀⠀⠀⠀⢠⣤⡀⣀⣤⣤⣄⡀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠀⠀⠀⣿⣿⡆';
      expect(classifyStderrMessage(input2)).toBe('skip');
    });

    it('プログレスバー文字のみをスキップする', () => {
      expect(classifyStderrMessage('████████░░')).toBe('skip');
      expect(classifyStderrMessage('▁▂▃▄▅▆▇█')).toBe('skip');
      expect(classifyStderrMessage('■□▪▫▬▭▮▯―')).toBe('skip');
    });

    it('数字のみの断片をスキップする', () => {
      expect(classifyStderrMessage('123')).toBe('skip');
      expect(classifyStderrMessage('42 8')).toBe('skip');
      expect(classifyStderrMessage(' 7 ')).toBe('skip');
    });

    it('Amazon Q情報メッセージを情報として分類する', () => {
      expect(classifyStderrMessage('Welcome to Amazon Q')).toBe('info');
      expect(classifyStderrMessage('✓ GitHub loaded')).toBe('info');
      expect(classifyStderrMessage('Loading workspace...')).toBe('info');
      expect(classifyStderrMessage('Ready to chat')).toBe('info');
      expect(classifyStderrMessage('You are chatting with Amazon Q')).toBe('info');
      expect(classifyStderrMessage('Thinking...')).toBe('info');
    });

    it('エラーメッセージをエラーとして分類する', () => {
      expect(classifyStderrMessage('Error: Something went wrong')).toBe('error');
      expect(classifyStderrMessage('Failed to load file')).toBe('error');
      expect(classifyStderrMessage('Cannot access resource')).toBe('error');
      expect(classifyStderrMessage('Permission denied')).toBe('error');
      expect(classifyStderrMessage('File not found')).toBe('error');
      expect(classifyStderrMessage('Connection refused')).toBe('error');
    });

    it('有効なチャットメッセージを情報として分類する', () => {
      expect(classifyStderrMessage("Hello! I'm Amazon Q, your AI coding assistant.")).toBe('info');
      expect(classifyStderrMessage('How can I help you with your project today?')).toBe('info');
      expect(classifyStderrMessage('I can help you write code, debug issues, and more.')).toBe(
        'info'
      );
    });

    it('Unicode文字と有効なテキストが混在する場合は情報として分類する', () => {
      expect(classifyStderrMessage('⢠⣶ Hello Amazon Q ⣶⣦⠀')).toBe('info');
      expect(classifyStderrMessage('Loading... ⠋')).toBe('info');
    });

    it('特別なケース: ローディング完了メッセージ', () => {
      expect(classifyStderrMessage('Error handler loaded')).toBe('info'); // "loaded"があるのでエラーではない
    });
  });
});
