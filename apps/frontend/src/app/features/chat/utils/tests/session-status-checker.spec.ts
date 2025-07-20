import { canChat, getDisabledReason, isSessionDisabled } from '../session-status-checker';
import type { AmazonQSession } from '../../../../core/types/amazon-q.types';

describe('session-status-checker', () => {
  const mockSession: AmazonQSession = {
    sessionId: 'test-session',
    projectId: 'test-project',
    projectPath: '/test/path',
    projectName: 'Test Project',
    status: 'active',
    startedAt: new Date(),
    lastActivity: new Date(),
    totalMessages: 0,
    totalTokens: 0,
  };

  describe('canChat', () => {
    it('アクティブなチャットで、エラーがなく、セッションがある場合はtrue', () => {
      expect(canChat(true, null, mockSession)).toBe(true);
    });

    it('非アクティブなチャットの場合はfalse', () => {
      expect(canChat(false, null, mockSession)).toBe(false);
    });

    it('エラーがある場合はfalse', () => {
      expect(canChat(true, 'Error occurred', mockSession)).toBe(false);
    });

    it('セッションがない場合はfalse', () => {
      expect(canChat(true, null, null)).toBe(false);
    });
  });

  describe('isSessionDisabled', () => {
    it('エラーがない場合はfalse', () => {
      expect(isSessionDisabled(null, mockSession)).toBe(false);
    });

    it('エラーがある場合はtrue', () => {
      expect(isSessionDisabled('Error occurred', mockSession)).toBe(true);
    });
  });

  describe('getDisabledReason', () => {
    it('エラーがなく、セッションがある場合はデフォルトメッセージ', () => {
      expect(getDisabledReason(null, mockSession)).toBe('Chat is temporarily unavailable.');
    });

    it('エラーがある場合はエラーメッセージを返す', () => {
      expect(getDisabledReason('Connection failed', mockSession)).toBe('Connection failed');
    });

    it('セッションがない場合は専用メッセージを返す', () => {
      expect(getDisabledReason(null, null)).toBe(
        'No active Amazon Q session. Please start a new project session.'
      );
    });
  });
});
