import { formatInfoMessage } from '../format-info-message';

describe('formatInfoMessage', () => {
  describe('基本メッセージフォーマット', () => {
    it('typeがundefinedの場合、generalとして扱われる', () => {
      const data = { sessionId: 'session-1', message: 'Test message' };
      const result = formatInfoMessage(data);
      expect(result).toBe('💬 Test message');
    });

    it('typeがgeneralの場合、💬プレフィックスが追加される', () => {
      const data = { sessionId: 'session-1', message: 'General message', type: 'general' };
      const result = formatInfoMessage(data);
      expect(result).toBe('💬 General message');
    });

    it('typeがinitializationの場合、ℹ️プレフィックスが追加される', () => {
      const data = { sessionId: 'session-1', message: 'Starting system', type: 'initialization' };
      const result = formatInfoMessage(data);
      expect(result).toBe('ℹ️ Starting system');
    });

    it('typeがstatusの場合、✅プレフィックスが追加される', () => {
      const data = { sessionId: 'session-1', message: 'Task completed', type: 'status' };
      const result = formatInfoMessage(data);
      expect(result).toBe('✅ Task completed');
    });

    it('typeがprogressの場合、⏳プレフィックスが追加される', () => {
      const data = { sessionId: 'session-1', message: 'Processing...', type: 'progress' };
      const result = formatInfoMessage(data);
      expect(result).toBe('⏳ Processing...');
    });

    it('未知のtypeの場合、generalとして扱われる', () => {
      const data = { sessionId: 'session-1', message: 'Unknown type message', type: 'unknown' };
      const result = formatInfoMessage(data);
      expect(result).toBe('💬 Unknown type message');
    });
  });

  describe('特別なメッセージ処理', () => {
    it('"thinking"メッセージが🤔 Thinking...に変換される', () => {
      const data = { sessionId: 'session-1', message: 'thinking' };
      const result = formatInfoMessage(data);
      expect(result).toBe('🤔 Thinking...');
    });

    it('"thinking..."メッセージが🤔 Thinking...に変換される', () => {
      const data = { sessionId: 'session-1', message: 'thinking...' };
      const result = formatInfoMessage(data);
      expect(result).toBe('🤔 Thinking...');
    });

    it('大文字の"THINKING"メッセージも変換される', () => {
      const data = { sessionId: 'session-1', message: 'THINKING' };
      const result = formatInfoMessage(data);
      expect(result).toBe('🤔 Thinking...');
    });

    it('混合ケースの"ThInKiNg"メッセージも変換される', () => {
      const data = { sessionId: 'session-1', message: 'ThInKiNg' };
      const result = formatInfoMessage(data);
      expect(result).toBe('🤔 Thinking...');
    });

    it('前後の空白がある"thinking"メッセージも変換される', () => {
      const data = { sessionId: 'session-1', message: '  thinking  ' };
      const result = formatInfoMessage(data);
      expect(result).toBe('🤔 Thinking...');
    });

    it('typeが指定されていても"thinking"が優先される', () => {
      const data = { sessionId: 'session-1', message: 'thinking', type: 'status' };
      const result = formatInfoMessage(data);
      expect(result).toBe('🤔 Thinking...');
    });
  });

  describe('空のメッセージ処理', () => {
    it('空文字列の場合、nullを返す', () => {
      const data = { sessionId: 'session-1', message: '' };
      const result = formatInfoMessage(data);
      expect(result).toBeNull();
    });

    it('空白のみの場合、nullを返す', () => {
      const data = { sessionId: 'session-1', message: '   ' };
      const result = formatInfoMessage(data);
      expect(result).toBeNull();
    });

    it('タブや改行のみの場合、nullを返す', () => {
      const data = { sessionId: 'session-1', message: '\t\n\r ' };
      const result = formatInfoMessage(data);
      expect(result).toBeNull();
    });

    it('非破壊スペースのみの場合、nullを返す', () => {
      const data = { sessionId: 'session-1', message: '\u00A0\u2000\u2028' };
      const result = formatInfoMessage(data);
      expect(result).toBeNull();
    });
  });

  describe('メッセージのトリミング', () => {
    it('前後の空白が削除される', () => {
      const data = { sessionId: 'session-1', message: '   Test message   ', type: 'general' };
      const result = formatInfoMessage(data);
      expect(result).toBe('💬 Test message');
    });

    it('メッセージ内の空白は保持される', () => {
      const data = {
        sessionId: 'session-1',
        message: 'Test   message   with   spaces',
        type: 'general',
      };
      const result = formatInfoMessage(data);
      expect(result).toBe('💬 Test   message   with   spaces');
    });

    it('改行文字を含むメッセージでも正常に処理される', () => {
      const data = { sessionId: 'session-1', message: 'Line 1\nLine 2\nLine 3', type: 'general' };
      const result = formatInfoMessage(data);
      expect(result).toBe('💬 Line 1\nLine 2\nLine 3');
    });
  });

  describe('様々なメッセージ内容', () => {
    it('Unicode文字を含むメッセージを正常に処理する', () => {
      const data = { sessionId: 'session-1', message: '日本語メッセージ 🚀', type: 'status' };
      const result = formatInfoMessage(data);
      expect(result).toBe('✅ 日本語メッセージ 🚀');
    });

    it('HTMLタグを含むメッセージをそのまま保持する', () => {
      const data = { sessionId: 'session-1', message: '<div>HTML content</div>', type: 'general' };
      const result = formatInfoMessage(data);
      expect(result).toBe('💬 <div>HTML content</div>');
    });

    it('特殊文字を含むメッセージを正常に処理する', () => {
      const data = {
        sessionId: 'session-1',
        message: 'Special chars: @#$%^&*()',
        type: 'initialization',
      };
      const result = formatInfoMessage(data);
      expect(result).toBe('ℹ️ Special chars: @#$%^&*()');
    });

    it('非常に長いメッセージを正常に処理する', () => {
      const longMessage = 'Long message: ' + 'x'.repeat(1000);
      const data = { sessionId: 'session-1', message: longMessage, type: 'progress' };
      const result = formatInfoMessage(data);
      expect(result).toBe(`⏳ ${longMessage}`);
    });

    it('JSONフォーマットのメッセージを正常に処理する', () => {
      const jsonMessage = '{"status": "success", "data": {"count": 5}}';
      const data = { sessionId: 'session-1', message: jsonMessage, type: 'status' };
      const result = formatInfoMessage(data);
      expect(result).toBe(`✅ ${jsonMessage}`);
    });
  });

  describe('dataオブジェクトの形式', () => {
    it('最小限のプロパティ（sessionId, message）で正常に動作する', () => {
      const data = { sessionId: 'session-1', message: 'Minimal data' };
      const result = formatInfoMessage(data);
      expect(result).toBe('💬 Minimal data');
    });

    it('追加のプロパティがあっても正常に動作する', () => {
      const data = {
        sessionId: 'session-1',
        message: 'Extra properties',
        type: 'status',
        timestamp: Date.now(),
        extra: 'value',
      } as unknown as string;
      const result = formatInfoMessage(data);
      expect(result).toBe('✅ Extra properties');
    });

    it('sessionIdが使用されることはない（フォーマットのみ）', () => {
      const data1 = { sessionId: 'session-1', message: 'Test' };
      const data2 = { sessionId: 'session-999', message: 'Test' };

      expect(formatInfoMessage(data1)).toBe(formatInfoMessage(data2));
    });
  });

  describe('エッジケース', () => {
    it('thinkingが含まれるが完全一致しない場合は変換されない', () => {
      const data = { sessionId: 'session-1', message: 'I am thinking about it' };
      const result = formatInfoMessage(data);
      expect(result).toBe('💬 I am thinking about it');
    });

    it('thinking に類似したメッセージは変換されない', () => {
      const similarMessages = ['thinkings', 'thinking-mode', 'rethinking', 'think', 'thought'];

      similarMessages.forEach(message => {
        const data = { sessionId: 'session-1', message };
        const result = formatInfoMessage(data);
        expect(result).toBe(`💬 ${message}`);
      });
    });

    it('空白文字のバリエーションを正しく処理する', () => {
      const whitespaceVariations = [
        ' thinking ',
        '\tthinking\t',
        '\nthinking\n',
        '\r\nthinking\r\n',
        '\u00A0thinking\u00A0', // Non-breaking space
      ];

      whitespaceVariations.forEach(message => {
        const data = { sessionId: 'session-1', message };
        const result = formatInfoMessage(data);
        expect(result).toBe('🤔 Thinking...');
      });
    });

    it('typeが空文字列の場合、generalとして扱われる', () => {
      const data = { sessionId: 'session-1', message: 'Empty type', type: '' };
      const result = formatInfoMessage(data);
      expect(result).toBe('💬 Empty type');
    });

    it('typeがnullの場合、generalとして扱われる', () => {
      const data = { sessionId: 'session-1', message: 'Null type', type: null as unknown as string };
      const result = formatInfoMessage(data);
      expect(result).toBe('💬 Null type');
    });
  });

  describe('パフォーマンス', () => {
    it('大量のメッセージフォーマットを効率的に処理する', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        const data = { sessionId: `session-${i}`, message: `Message ${i}`, type: 'general' };
        formatInfoMessage(data);
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(100); // 100ms以内
    });

    it('複雑な条件分岐でも効率的に動作する', () => {
      const testCases = [
        { message: 'thinking', expected: '🤔 Thinking...' },
        { message: 'normal message', type: 'status', expected: '✅ normal message' },
        { message: '   ', expected: null },
        { message: 'progress update', type: 'progress', expected: '⏳ progress update' },
      ];

      const start = performance.now();

      for (let i = 0; i < 250; i++) {
        testCases.forEach(testCase => {
          const data = { sessionId: 'perf-test', message: testCase.message, type: testCase.type };
          const result = formatInfoMessage(data);
          expect(result).toBe(testCase.expected);
        });
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(50); // 50ms以内
    });
  });
});
