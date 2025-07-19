import { shouldDisplayError } from '../should-display-error';

describe('shouldDisplayError', () => {
  describe('表示すべきエラー', () => {
    it('一般的なエラーメッセージは表示する', () => {
      const errors = [
        'Connection failed',
        'Authentication error',
        'Network timeout',
        'File not found',
        'Permission denied',
        'Internal server error'
      ];

      errors.forEach(error => {
        expect(shouldDisplayError(error)).toBe(true);
      });
    });

    it('詳細なエラーメッセージは表示する', () => {
      const detailedErrors = [
        'Failed to connect to server at localhost:3000',
        'User authentication failed: invalid credentials',
        'Database query timeout after 30 seconds',
        'File upload failed: file size exceeds 10MB limit'
      ];

      detailedErrors.forEach(error => {
        expect(shouldDisplayError(error)).toBe(true);
      });
    });

    it('日本語のエラーメッセージは表示する', () => {
      const japaneseErrors = [
        'エラーが発生しました',
        '接続に失敗しました',
        'ファイルが見つかりません',
        'アクセス権限がありません'
      ];

      japaneseErrors.forEach(error => {
        expect(shouldDisplayError(error)).toBe(true);
      });
    });

    it('特殊文字を含むエラーメッセージは表示する', () => {
      const specialCharErrors = [
        'Error: 500 - Internal Server Error',
        'Connection failed @ 192.168.1.1:8080',
        'Authentication failed for user "test@example.com"',
        'File path "/usr/local/bin" not accessible'
      ];

      specialCharErrors.forEach(error => {
        expect(shouldDisplayError(error)).toBe(true);
      });
    });
  });

  describe('表示しないエラー（制御文字パターン）', () => {
    it('制御文字のみの場合は表示しない', () => {
      const controlCharPatterns = [
        '\x00',
        '\x01',
        '\x1f',
        '\x00\x01\x1f',
        '  \x00  ',
        '\t\x01\t'
      ];

      controlCharPatterns.forEach(pattern => {
        expect(shouldDisplayError(pattern)).toBe(false);
      });
    });

    it('スピナー文字のみの場合は表示しない', () => {
      const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

      spinnerChars.forEach(char => {
        expect(shouldDisplayError(char)).toBe(false);
        expect(shouldDisplayError(`  ${char}  `)).toBe(false);
      });
    });

    it('複数のスピナー文字の組み合わせは表示する', () => {
      expect(shouldDisplayError('⠋⠙')).toBe(true);
      expect(shouldDisplayError('⠋ Loading')).toBe(true);
    });
  });

  describe('表示しないエラー（MCPサーバーメッセージ）', () => {
    it('MCPサーバー初期化メッセージは表示しない', () => {
      const mcpMessages = [
        'mcp server initialized',
        'MCP SERVER INITIALIZED',
        'mcp servers initialized',
        'MCP SERVERS INITIALIZED',
        'The mcp server initialized successfully',
        'Multiple mcp servers initialized'
      ];

      mcpMessages.forEach(message => {
        expect(shouldDisplayError(message)).toBe(false);
      });
    });

    it('MCPサーバーメッセージに類似したものは表示する', () => {
      const similarMessages = [
        'tcp server initialized', // mcp → tcp
        'mcp client initialized', // server → client
        'mcp server terminated',  // initialized → terminated
        'initialize mcp server'   // 語順が異なる
      ];

      similarMessages.forEach(message => {
        expect(shouldDisplayError(message)).toBe(true);
      });
    });
  });

  describe('表示しないエラー（チャット開始指示）', () => {
    it('Ctrl-Cチャット開始指示は表示しない', () => {
      const ctrlCMessages = [
        'ctrl-c to start chatting',
        'CTRL-C TO START CHATTING',
        'Press ctrl-c to start chatting',
        'Use ctrl-c to start chatting now'
      ];

      ctrlCMessages.forEach(message => {
        expect(shouldDisplayError(message)).toBe(false);
      });
    });

    it('Ctrl-C以外の指示は表示する', () => {
      const otherMessages = [
        'ctrl-a to start chatting', // ctrl-c → ctrl-a
        'ctrl-c to stop chatting',  // start → stop
        'ctrl-c for configuration'  // chatting → configuration
      ];

      otherMessages.forEach(message => {
        expect(shouldDisplayError(message)).toBe(true);
      });
    });
  });

  describe('表示しないエラー（Enterキー指示）', () => {
    it('Enter キー継続指示は表示しない', () => {
      const enterMessages = [
        'press enter to continue',
        'PRESS ENTER TO CONTINUE',
        'Press Enter key to continue',
        'Hit enter to continue',
        'Push enter to continue'
      ];

      enterMessages.forEach(message => {
        expect(shouldDisplayError(message)).toBe(false);
      });
    });

    it('Enter キー以外の指示は表示する', () => {
      const otherKeyMessages = [
        'press space to continue',  // enter → space
        'press enter to cancel',    // continue → cancel
        'press enter when ready'    // continue → when ready
      ];

      otherKeyMessages.forEach(message => {
        expect(shouldDisplayError(message)).toBe(true);
      });
    });
  });

  describe('表示しないエラー（ローディング・初期化メッセージ）', () => {
    it('ローディングメッセージは表示しない', () => {
      const loadingMessages = [
        'loading',
        'LOADING',
        'Loading...',
        'Now loading',
        'Loading data',
        'Still loading'
      ];

      loadingMessages.forEach(message => {
        expect(shouldDisplayError(message)).toBe(false);
      });
    });

    it('初期化メッセージは表示しない', () => {
      const initializingMessages = [
        'initializing',
        'INITIALIZING',
        'Initializing...',
        'Now initializing',
        'Initializing system',
        'Still initializing'
      ];

      initializingMessages.forEach(message => {
        expect(shouldDisplayError(message)).toBe(false);
      });
    });

    it('ローディング・初期化以外の -ing 動詞は表示する', () => {
      const otherIngMessages = [
        'processing failed',
        'connecting error',
        'validating error',
        'downloading failed'
      ];

      otherIngMessages.forEach(message => {
        expect(shouldDisplayError(message)).toBe(true);
      });
    });
  });

  describe('表示しないエラー（単一文字）', () => {
    it('単一の"m"文字は表示しない', () => {
      const singleMPatterns = [
        'm',
        'M',
        '  m  ',
        '\tm\t',
        '\nm\n'
      ];

      singleMPatterns.forEach(pattern => {
        expect(shouldDisplayError(pattern)).toBe(false);
      });
    });

    it('他の単一文字は表示する', () => {
      const otherSingleChars = ['a', 'b', 'x', 'z', '1', '!', '@'];

      otherSingleChars.forEach(char => {
        expect(shouldDisplayError(char)).toBe(true);
      });
    });

    it('"m"を含む長いメッセージは表示する', () => {
      const messagesWithM = [
        'message',
        'error message',
        'connection timeout',
        'system malfunction'
      ];

      messagesWithM.forEach(message => {
        expect(shouldDisplayError(message)).toBe(true);
      });
    });
  });

  describe('空のエラー処理', () => {
    it('空文字列は表示しない', () => {
      expect(shouldDisplayError('')).toBe(false);
    });

    it('空白のみは表示しない', () => {
      const whitespacePatterns = [
        ' ',
        '   ',
        '\t',
        '\n',
        '\r',
        '\r\n',
        '  \t  \n  ',
        '\u00A0',      // Non-breaking space
        '\u2000',      // En quad
        '\u2028'       // Line separator
      ];

      whitespacePatterns.forEach(pattern => {
        expect(shouldDisplayError(pattern)).toBe(false);
      });
    });
  });

  describe('複合パターンのテスト', () => {
    it('複数の条件を組み合わせたメッセージ', () => {
      const complexMessages = [
        'Loading mcp server initialized',     // loading + mcp → 表示しない
        'mcp server initializing',            // mcp + initializing → 表示しない
        'Press enter to start loading',       // enter + loading → 表示しない
        'ctrl-c loading initialization'       // ctrl-c + loading + initializing → 表示しない
      ];

      complexMessages.forEach(message => {
        expect(shouldDisplayError(message)).toBe(false);
      });
    });

    it('パターンにマッチしない類似メッセージは表示する', () => {
      const similarButDifferent = [
        'loaded successfully',        // loading に似ているが異なる
        'initialized with errors',    // initializing に似ているが異なる
        'mcp client connected',       // mcp server に似ているが異なる
        'alt-c to start chatting'     // ctrl-c に似ているが異なる
      ];

      similarButDifferent.forEach(message => {
        expect(shouldDisplayError(message)).toBe(true);
      });
    });
  });

  describe('国際化とUnicode', () => {
    it('Unicode文字を含むエラーメッセージを適切に処理する', () => {
      const unicodeErrors = [
        'エラー: 接続失敗 🚨',
        '错误：连接失败',
        'Ошибка: подключение не удалось',
        'Error: 🔥 Something went wrong!'
      ];

      unicodeErrors.forEach(error => {
        expect(shouldDisplayError(error)).toBe(true);
      });
    });

    it('Unicode制御文字は適切にフィルタリングされる', () => {
      const unicodeControlChars = [
        '\u0000', // NULL
        '\u001F', // Unit Separator
        '\u007F', // DELETE
        '\u0080', // Padding Character
        '\u009F'  // Application Program Command
      ];

      // 標準の制御文字範囲のテスト
      unicodeControlChars.slice(0, 2).forEach(char => {
        expect(shouldDisplayError(char)).toBe(false);
      });

      // 範囲外の文字は表示される
      unicodeControlChars.slice(2).forEach(char => {
        expect(shouldDisplayError(char)).toBe(true);
      });
    });
  });

  describe('パフォーマンス', () => {
    it('大量のエラーメッセージ判定を効率的に処理する', () => {
      const testMessages = [
        'Connection failed',
        'loading',
        'mcp server initialized',
        'ctrl-c to start chatting',
        'press enter to continue',
        'initializing',
        'm',
        '⠋',
        'Real error message'
      ];

      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        testMessages.forEach(message => {
          shouldDisplayError(message);
        });
      }
      
      const end = performance.now();
      expect(end - start).toBeLessThan(100); // 100ms以内
    });

    it('複雑な正規表現パターンでも効率的に動作する', () => {
      const complexMessages = Array.from({ length: 100 }, (_, i) => 
        `Complex error message ${i} with various patterns loading and mcp server content`
      );

      const start = performance.now();
      
      complexMessages.forEach(message => {
        shouldDisplayError(message);
      });
      
      const end = performance.now();
      expect(end - start).toBeLessThan(50); // 50ms以内
    });
  });

  describe('エッジケース', () => {
    it('非常に長いメッセージでも正常に動作する', () => {
      const veryLongMessage = 'Error: ' + 'x'.repeat(10000) + ' connection failed';
      expect(shouldDisplayError(veryLongMessage)).toBe(true);
    });

    it('非常に長いスキップパターンマッチでも正常に動作する', () => {
      const longLoadingMessage = 'loading ' + 'x'.repeat(10000);
      expect(shouldDisplayError(longLoadingMessage)).toBe(false);
    });

    it('改行を含むメッセージを適切に処理する', () => {
      const multilineMessages = [
        'Line 1\nloading\nLine 3',        // 途中にloadingがある → 表示しない
        'Error occurred\non line 2',      // 改行を含むエラー → 表示する
        'mcp server\ninitialized',        // 改行を挟んだパターン → 表示しない
        'Real error\nmessage here'        // 実際のエラー → 表示する
      ];

      expect(shouldDisplayError(multilineMessages[0])).toBe(false);
      expect(shouldDisplayError(multilineMessages[1])).toBe(true);
      expect(shouldDisplayError(multilineMessages[2])).toBe(false);
      expect(shouldDisplayError(multilineMessages[3])).toBe(true);
    });
  });
});