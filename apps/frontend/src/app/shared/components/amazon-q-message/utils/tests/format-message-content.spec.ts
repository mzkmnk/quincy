import { formatMessageContent } from '../format-message-content';

describe('formatMessageContent', () => {
  describe('基本機能', () => {
    it('通常のテキストをそのまま返す', () => {
      expect(formatMessageContent('Hello, World!')).toBe('Hello, World!');
      expect(formatMessageContent('This is a test message')).toBe('This is a test message');
    });

    it('前後の空白を削除する', () => {
      expect(formatMessageContent('  Hello  ')).toBe('Hello');
      expect(formatMessageContent('\t\tText\t\t')).toBe('Text');
      expect(formatMessageContent('\n\nMessage\n\n')).toBe('Message');
    });

    it('複数の空白文字の組み合わせを処理する', () => {
      expect(formatMessageContent(' \t\n Hello \t\n ')).toBe('Hello');
      expect(formatMessageContent('\r\n\t Test \r\n\t')).toBe('Test');
    });
  });

  describe('特殊ケース', () => {
    it('空文字列の場合、空文字列を返す', () => {
      expect(formatMessageContent('')).toBe('');
    });

    it('空白のみの場合、空文字列を返す', () => {
      expect(formatMessageContent('   ')).toBe('');
      expect(formatMessageContent('\t\t')).toBe('');
      expect(formatMessageContent('\n\n')).toBe('');
      expect(formatMessageContent(' \t\n\r ')).toBe('');
    });

    it('null/undefinedの場合、空文字列を返す', () => {
      expect(formatMessageContent(null as any)).toBe('');
      expect(formatMessageContent(undefined as any)).toBe('');
    });
  });

  describe('マークダウンコンテンツ', () => {
    it('マークダウン形式のテキストを正しく処理する', () => {
      const markdown = '# Header\n\n**Bold text** and *italic text*';
      expect(formatMessageContent(markdown)).toBe('# Header\n\n**Bold text** and *italic text*');
    });

    it('コードブロックを正しく処理する', () => {
      const codeBlock = '```javascript\nconst x = 1;\n```';
      expect(formatMessageContent(codeBlock)).toBe('```javascript\nconst x = 1;\n```');
    });

    it('インラインコードを正しく処理する', () => {
      const inlineCode = 'Use `console.log()` for debugging';
      expect(formatMessageContent(inlineCode)).toBe('Use `console.log()` for debugging');
    });
  });

  describe('特殊文字の処理', () => {
    it('HTMLタグを含むテキストを正しく処理する', () => {
      const htmlContent = '<div>Hello <strong>World</strong></div>';
      expect(formatMessageContent(htmlContent)).toBe('<div>Hello <strong>World</strong></div>');
    });

    it('エスケープ文字を含むテキストを正しく処理する', () => {
      const escapedText = 'Line 1\\nLine 2\\tTabbed';
      expect(formatMessageContent(escapedText)).toBe('Line 1\\nLine 2\\tTabbed');
    });

    it('Unicode文字を正しく処理する', () => {
      const unicodeText = '日本語のメッセージ 🚀 テスト';
      expect(formatMessageContent(unicodeText)).toBe('日本語のメッセージ 🚀 テスト');
    });

    it('特殊記号を正しく処理する', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      expect(formatMessageContent(specialChars)).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?');
    });
  });

  describe('長いコンテンツの処理', () => {
    it('非常に長いテキストを正しく処理する', () => {
      const longText = 'A'.repeat(10000);
      const withSpaces = '  ' + longText + '  ';
      expect(formatMessageContent(withSpaces)).toBe(longText);
    });

    it('改行を含む長いテキストを正しく処理する', () => {
      const multilineText = Array.from({ length: 100 }, (_, i) => `Line ${i}`).join('\n');
      const withSpaces = '  ' + multilineText + '  ';
      expect(formatMessageContent(withSpaces)).toBe(multilineText);
    });
  });

  describe('メッセージタイプ別のテスト', () => {
    it('ユーザーメッセージを正しく処理する', () => {
      const userMessage = ' How can I implement a login form? ';
      expect(formatMessageContent(userMessage)).toBe('How can I implement a login form?');
    });

    it('AIレスポンスを正しく処理する', () => {
      const aiResponse = `  To implement a login form, you can:
      
1. Create an HTML form
2. Add validation
3. Handle submission  `;

      const expected = `To implement a login form, you can:
      
1. Create an HTML form
2. Add validation
3. Handle submission`;

      expect(formatMessageContent(aiResponse)).toBe(expected);
    });

    it('エラーメッセージを正しく処理する', () => {
      const errorMessage = '  Error: Connection failed. Please try again.  ';
      expect(formatMessageContent(errorMessage)).toBe(
        'Error: Connection failed. Please try again.'
      );
    });
  });

  describe('パフォーマンス', () => {
    it('大量の短いメッセージでも効率的に処理する', () => {
      const messages = Array.from({ length: 1000 }, (_, i) => `  Message ${i}  `);

      const start = performance.now();
      messages.forEach(msg => formatMessageContent(msg));
      const end = performance.now();

      expect(end - start).toBeLessThan(50); // 50ms以内
    });

    it('長いメッセージでも効率的に処理する', () => {
      const longMessage = '  ' + 'Very long message content. '.repeat(1000) + '  ';

      const start = performance.now();
      const result = formatMessageContent(longMessage);
      const end = performance.now();

      expect(end - start).toBeLessThan(10); // 10ms以内
      expect(result).toBe(longMessage.trim());
    });
  });

  describe('実際の使用シナリオ', () => {
    it('チャットメッセージの表示準備', () => {
      const rawMessage = '  Hello! How are you doing today?  ';
      const formatted = formatMessageContent(rawMessage);

      expect(formatted).toBe('Hello! How are you doing today?');
      expect(formatted.startsWith(' ')).toBe(false);
      expect(formatted.endsWith(' ')).toBe(false);
    });

    it('APIレスポンスのクリーンアップ', () => {
      const apiResponse = `  
      
      Based on your question, here's what I recommend:
      
      1. Start with the basics
      2. Practice regularly
      3. Ask questions when stuck
      
      `;

      const formatted = formatMessageContent(apiResponse);
      expect(formatted).not.toMatch(/^\s+/); // 先頭に空白なし
      expect(formatted).not.toMatch(/\s+$/); // 末尾に空白なし
      expect(formatted).toContain('Based on your question');
    });

    it('空のメッセージハンドリング', () => {
      const emptyMessages = ['', '  ', '\t', '\n', '   \t\n  '];

      emptyMessages.forEach(msg => {
        expect(formatMessageContent(msg)).toBe('');
      });
    });
  });
});
