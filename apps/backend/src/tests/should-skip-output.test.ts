/**
 * should-skip-output関数のテスト
 */

import { shouldSkipOutput } from '../services/amazon-q-cli/message-handler/should-skip-output';

describe('should-skip-output', () => {
  describe('shouldSkipOutput', () => {
    it('空文字列をスキップする', () => {
      expect(shouldSkipOutput('')).toBe(true);
    });

    it('空白のみをスキップする', () => {
      expect(shouldSkipOutput('   ')).toBe(true);
      expect(shouldSkipOutput('\t\n ')).toBe(true);
    });

    it('ドットやブレットのみをスキップする', () => {
      expect(shouldSkipOutput('.')).toBe(true);
      expect(shouldSkipOutput('•')).toBe(true);
      expect(shouldSkipOutput('●')).toBe(true);
      expect(shouldSkipOutput(' . ')).toBe(true);
    });

    it('スピナー文字のみをスキップする', () => {
      expect(shouldSkipOutput('⠋')).toBe(true);
      expect(shouldSkipOutput('⠙')).toBe(true);
      expect(shouldSkipOutput('⠹')).toBe(true);
      expect(shouldSkipOutput(' ⠸ ')).toBe(true);
    });

    it('実際のAmazon QのUnicode装飾文字をスキップする', () => {
      const input1 = '⢠⣶⣶⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣶⣿⣿⣿⣶⣦⡀⠀';
      expect(shouldSkipOutput(input1)).toBe(true);
    });

    it('Unicode装飾文字2をスキップする', () => {
      const input2 = '⠀⠀⠀⣾⡿⢻⣿⡆⠀⠀⠀⢀⣄⡄⢀⣠⣤⣤⡀⢀⣠⣤⣤⡀⠀⠀⢀⣠⣤⣤⣤⣄⠀⠀⢀⣤⣤⣤⣤⣤⣤⡀⠀⠀⣀⣤⣤⣤⣀⠀⠀⠀⢠⣤⡀⣀⣤⣤⣄⡀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠀⠀⠀⣿⣿⡆';
      expect(shouldSkipOutput(input2)).toBe(true);
    });

    it('プログレスバー文字のみをスキップする', () => {
      expect(shouldSkipOutput('████████░░')).toBe(true);
      expect(shouldSkipOutput('▁▂▃▄▅▆▇█')).toBe(true);
      expect(shouldSkipOutput('■□▪▫▬▭▮▯―')).toBe(true);
    });

    it('Unicodeスペース文字のみをスキップする', () => {
      expect(shouldSkipOutput('\u00A0\u2000\u2001\u2002')).toBe(true);
      expect(shouldSkipOutput('\u3000')).toBe(true); // 全角スペース
    });

    it('有効なテキストメッセージをスキップしない', () => {
      expect(shouldSkipOutput("Hello! I'm Amazon Q")).toBe(false);
      expect(shouldSkipOutput('How can I help you?')).toBe(false);
      expect(shouldSkipOutput('Thinking...')).toBe(false);
    });

    it('Unicode文字と有効なテキストが混在する場合はスキップしない', () => {
      expect(shouldSkipOutput('⢠⣶ Hello Amazon Q ⣶⣦⠀')).toBe(false);
      expect(shouldSkipOutput('Loading... ⠋')).toBe(false);
    });

    it('制御文字のみをスキップする', () => {
      expect(shouldSkipOutput('\x00\x01\x02')).toBe(true);
      expect(shouldSkipOutput('\x08\x0B\x0C')).toBe(true);
    });

    it('改行文字のみをスキップする', () => {
      expect(shouldSkipOutput('\n')).toBe(true);
      expect(shouldSkipOutput('\r\n')).toBe(true);
      expect(shouldSkipOutput('\n\r')).toBe(true);
    });
  });
});
