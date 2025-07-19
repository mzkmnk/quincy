import { isSessionDisabled, canChat, getDisabledReason } from '../session-status-checker';

describe('session-status-checker', () => {
  describe('isSessionDisabled', () => {
    describe('セッションが無効と判定される場合', () => {
      it('sessionErrorがnull以外の場合、trueを返す', () => {
        const sessionError = 'Connection failed';
        const currentQSession = { id: 'session-123' };

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(true);
      });

      it('currentQSessionがnullの場合、trueを返す', () => {
        const sessionError = null;
        const currentQSession = null;

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(true);
      });

      it('currentQSessionがundefinedの場合、trueを返す', () => {
        const sessionError = null;
        const currentQSession = undefined;

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(true);
      });

      it('sessionErrorとcurrentQSession両方に問題がある場合、trueを返す', () => {
        const sessionError = 'Error occurred';
        const currentQSession = null;

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(true);
      });

      it('空文字列のsessionErrorでもtrueを返す', () => {
        const sessionError = '';
        const currentQSession = { id: 'session-123' };

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(true);
      });

      it('空白のみのsessionErrorでもtrueを返す', () => {
        const sessionError = '   ';
        const currentQSession = { id: 'session-123' };

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(true);
      });
    });

    describe('セッションが有効と判定される場合', () => {
      it('sessionErrorがnullでcurrentQSessionが有効な場合、falseを返す', () => {
        const sessionError = null;
        const currentQSession = { id: 'session-123' };

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(false);
      });

      it('currentQSessionが空オブジェクトでもfalseを返す', () => {
        const sessionError = null;
        const currentQSession = {};

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(false);
      });

      it('currentQSessionが複雑なオブジェクトでもfalseを返す', () => {
        const sessionError = null;
        const currentQSession = {
          id: 'session-123',
          projectPath: '/path/to/project',
          active: true,
          metadata: { created: Date.now() },
        };

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(false);
      });
    });

    describe('falsy値のテスト', () => {
      it('currentQSessionが0の場合、trueを返す', () => {
        const sessionError = null;
        const currentQSession = 0;

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(true);
      });

      it('currentQSessionが空文字列の場合、trueを返す', () => {
        const sessionError = null;
        const currentQSession = '';

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(true);
      });

      it('currentQSessionがfalseの場合、trueを返す', () => {
        const sessionError = null;
        const currentQSession = false;

        expect(isSessionDisabled(sessionError, currentQSession)).toBe(true);
      });
    });
  });

  describe('canChat', () => {
    describe('チャット可能な場合', () => {
      it('isActiveChatがtrueでセッションが有効な場合、trueを返す', () => {
        const isActiveChat = true;
        const sessionError = null;
        const currentQSession = { id: 'session-123' };

        expect(canChat(isActiveChat, sessionError, currentQSession)).toBe(true);
      });
    });

    describe('チャット不可能な場合', () => {
      it('isActiveChatがfalseの場合、falseを返す', () => {
        const isActiveChat = false;
        const sessionError = null;
        const currentQSession = { id: 'session-123' };

        expect(canChat(isActiveChat, sessionError, currentQSession)).toBe(false);
      });

      it('isActiveChatがtrueでもセッションが無効な場合、falseを返す', () => {
        const isActiveChat = true;
        const sessionError = 'Connection error';
        const currentQSession = { id: 'session-123' };

        expect(canChat(isActiveChat, sessionError, currentQSession)).toBe(false);
      });

      it('isActiveChatがtrueでもcurrentQSessionがnullの場合、falseを返す', () => {
        const isActiveChat = true;
        const sessionError = null;
        const currentQSession = null;

        expect(canChat(isActiveChat, sessionError, currentQSession)).toBe(false);
      });

      it('全ての条件が満たされない場合、falseを返す', () => {
        const isActiveChat = false;
        const sessionError = 'Error';
        const currentQSession = null;

        expect(canChat(isActiveChat, sessionError, currentQSession)).toBe(false);
      });
    });

    describe('isSessionDisabledとの連携', () => {
      it('isSessionDisabledの結果を正しく使用する', () => {
        // セッション有効ケース
        expect(canChat(true, null, { id: 'session' })).toBe(true);

        // セッション無効ケース（エラーあり）
        expect(canChat(true, 'error', { id: 'session' })).toBe(false);

        // セッション無効ケース（セッションなし）
        expect(canChat(true, null, null)).toBe(false);
      });
    });

    describe('様々なisActiveChatの値', () => {
      const sessionError = null;
      const currentQSession = { id: 'session-123' };

      it('isActiveChatがtruthyな値でtrueを返す', () => {
        expect(canChat(true, sessionError, currentQSession)).toBe(true);
        expect(canChat(1 as unknown as string, sessionError, currentQSession)).toBe(true);
        expect(canChat('active' as unknown as string, sessionError, currentQSession)).toBe(true);
        expect(canChat({} as unknown as string, sessionError, currentQSession)).toBe(true);
      });

      it('isActiveChatがfalsyな値でfalseを返す', () => {
        expect(canChat(false, sessionError, currentQSession)).toBe(false);
        expect(canChat(0 as unknown as string, sessionError, currentQSession)).toBe(false);
        expect(canChat('' as unknown as string, sessionError, currentQSession)).toBe(false);
        expect(canChat(null as unknown as string, sessionError, currentQSession)).toBe(false);
        expect(canChat(undefined as unknown as string, sessionError, currentQSession)).toBe(false);
      });
    });
  });

  describe('getDisabledReason', () => {
    describe('sessionErrorがある場合', () => {
      it('sessionErrorをそのまま返す', () => {
        const sessionError = 'Connection timeout';
        const currentQSession = { id: 'session-123' };

        expect(getDisabledReason(sessionError, currentQSession)).toBe('Connection timeout');
      });

      it('空文字列のsessionErrorもそのまま返す', () => {
        const sessionError = '';
        const currentQSession = { id: 'session-123' };

        expect(getDisabledReason(sessionError, currentQSession)).toBe('');
      });

      it('空白のみのsessionErrorもそのまま返す', () => {
        const sessionError = '   ';
        const currentQSession = { id: 'session-123' };

        expect(getDisabledReason(sessionError, currentQSession)).toBe('   ');
      });

      it('特殊文字を含むsessionErrorもそのまま返す', () => {
        const sessionError = 'Error: 接続に失敗しました 🚨';
        const currentQSession = { id: 'session-123' };

        expect(getDisabledReason(sessionError, currentQSession)).toBe(
          'Error: 接続に失敗しました 🚨'
        );
      });

      it('非常に長いsessionErrorもそのまま返す', () => {
        const sessionError = 'Very long error message: ' + 'x'.repeat(1000);
        const currentQSession = { id: 'session-123' };

        expect(getDisabledReason(sessionError, currentQSession)).toBe(sessionError);
      });
    });

    describe('sessionErrorがnullでcurrentQSessionがない場合', () => {
      it('currentQSessionがnullの場合、標準メッセージを返す', () => {
        const sessionError = null;
        const currentQSession = null;

        expect(getDisabledReason(sessionError, currentQSession)).toBe(
          'No active Amazon Q session. Please start a new project session.'
        );
      });

      it('currentQSessionがundefinedの場合、標準メッセージを返す', () => {
        const sessionError = null;
        const currentQSession = undefined;

        expect(getDisabledReason(sessionError, currentQSession)).toBe(
          'No active Amazon Q session. Please start a new project session.'
        );
      });

      it('currentQSessionがfalsyな値の場合、標準メッセージを返す', () => {
        const sessionError = null;
        const falsyValues = [false, 0, '', NaN];

        falsyValues.forEach(falsyValue => {
          expect(getDisabledReason(sessionError, falsyValue)).toBe(
            'No active Amazon Q session. Please start a new project session.'
          );
        });
      });
    });

    describe('sessionErrorがnullでcurrentQSessionがある場合', () => {
      it('デフォルトメッセージを返す', () => {
        const sessionError = null;
        const currentQSession = { id: 'session-123' };

        expect(getDisabledReason(sessionError, currentQSession)).toBe(
          'Chat is temporarily unavailable.'
        );
      });

      it('空オブジェクトのcurrentQSessionでもデフォルトメッセージを返す', () => {
        const sessionError = null;
        const currentQSession = {};

        expect(getDisabledReason(sessionError, currentQSession)).toBe(
          'Chat is temporarily unavailable.'
        );
      });

      it('複雑なcurrentQSessionでもデフォルトメッセージを返す', () => {
        const sessionError = null;
        const currentQSession = {
          id: 'session-123',
          projectPath: '/path/to/project',
          active: true,
          metadata: { created: Date.now() },
        };

        expect(getDisabledReason(sessionError, currentQSession)).toBe(
          'Chat is temporarily unavailable.'
        );
      });
    });

    describe('優先順位のテスト', () => {
      it('sessionErrorがある場合、currentQSessionの状態に関係なくsessionErrorが優先される', () => {
        const sessionError = 'Priority error';

        // currentQSessionがnullでも
        expect(getDisabledReason(sessionError, null)).toBe(sessionError);

        // currentQSessionがあっても
        expect(getDisabledReason(sessionError, { id: 'session' })).toBe(sessionError);
      });

      it('sessionErrorがnullの場合のみcurrentQSessionの状態が評価される', () => {
        const sessionError = null;

        expect(getDisabledReason(sessionError, null)).toBe(
          'No active Amazon Q session. Please start a new project session.'
        );

        expect(getDisabledReason(sessionError, { id: 'session' })).toBe(
          'Chat is temporarily unavailable.'
        );
      });
    });

    describe('エッジケース', () => {
      it('sessionErrorが非文字列でも正常に動作する', () => {
        // TypeScriptでは型エラーになるが、ランタイムでの動作を確認
        const sessionError = 123 as unknown as string;
        const currentQSession = { id: 'session' };

        expect(getDisabledReason(sessionError, currentQSession)).toBe(123);
      });

      it('sessionErrorがオブジェクトでも正常に動作する', () => {
        const sessionError = { code: 500, message: 'Error' } as unknown as string;
        const currentQSession = { id: 'session' };

        expect(getDisabledReason(sessionError, currentQSession)).toBe(sessionError);
      });
    });
  });

  describe('関数間の連携テスト', () => {
    it('isSessionDisabledとgetDisabledReasonの結果が一致する', () => {
      const testCases = [
        { sessionError: 'Error', currentQSession: { id: 'session' } },
        { sessionError: null, currentQSession: null },
        { sessionError: null, currentQSession: { id: 'session' } },
        { sessionError: '', currentQSession: { id: 'session' } },
      ];

      testCases.forEach(({ sessionError, currentQSession }) => {
        const isDisabled = isSessionDisabled(sessionError, currentQSession);
        const reason = getDisabledReason(sessionError, currentQSession);

        if (isDisabled) {
          // セッションが無効な場合、理由が返される
          expect(reason).toBeTruthy();
        }
        // セッションが有効でも理由は返される（デフォルトメッセージ）
      });
    });

    it('canChatとisSessionDisabledの結果が一致する', () => {
      const testCases = [
        { isActiveChat: true, sessionError: 'Error', currentQSession: { id: 'session' } },
        { isActiveChat: true, sessionError: null, currentQSession: null },
        { isActiveChat: true, sessionError: null, currentQSession: { id: 'session' } },
        { isActiveChat: false, sessionError: null, currentQSession: { id: 'session' } },
      ];

      testCases.forEach(({ isActiveChat, sessionError, currentQSession }) => {
        const canChatResult = canChat(isActiveChat, sessionError, currentQSession);
        const isDisabled = isSessionDisabled(sessionError, currentQSession);

        if (isActiveChat) {
          expect(canChatResult).toBe(!isDisabled);
        } else {
          expect(canChatResult).toBe(false);
        }
      });
    });
  });

  describe('実際の使用シナリオ', () => {
    it('正常なチャットセッション', () => {
      const isActiveChat = true;
      const sessionError = null;
      const currentQSession = { id: 'session-123', projectPath: '/project' };

      expect(isSessionDisabled(sessionError, currentQSession)).toBe(false);
      expect(canChat(isActiveChat, sessionError, currentQSession)).toBe(true);
      expect(getDisabledReason(sessionError, currentQSession)).toBe(
        'Chat is temporarily unavailable.'
      );
    });

    it('接続エラーが発生したセッション', () => {
      const isActiveChat = true;
      const sessionError = 'WebSocket connection failed';
      const currentQSession = { id: 'session-123' };

      expect(isSessionDisabled(sessionError, currentQSession)).toBe(true);
      expect(canChat(isActiveChat, sessionError, currentQSession)).toBe(false);
      expect(getDisabledReason(sessionError, currentQSession)).toBe('WebSocket connection failed');
    });

    it('セッションが開始されていない状態', () => {
      const isActiveChat = true;
      const sessionError = null;
      const currentQSession = null;

      expect(isSessionDisabled(sessionError, currentQSession)).toBe(true);
      expect(canChat(isActiveChat, sessionError, currentQSession)).toBe(false);
      expect(getDisabledReason(sessionError, currentQSession)).toBe(
        'No active Amazon Q session. Please start a new project session.'
      );
    });

    it('履歴表示モードでのチャット', () => {
      const isActiveChat = false; // 履歴表示中
      const sessionError = null;
      const currentQSession = { id: 'session-123' };

      expect(isSessionDisabled(sessionError, currentQSession)).toBe(false);
      expect(canChat(isActiveChat, sessionError, currentQSession)).toBe(false);
      expect(getDisabledReason(sessionError, currentQSession)).toBe(
        'Chat is temporarily unavailable.'
      );
    });
  });
});
