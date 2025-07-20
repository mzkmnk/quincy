import type { AmazonQConversation, ConversationMetadata } from '@quincy/shared';

import { getProjectName, getProjectPathFromConversation } from '../project-path-utils';

describe('project-path-utils', () => {
  describe('getProjectName', () => {
    it('Unix/Linux/Macの絶対パスからプロジェクト名を取得する', () => {
      expect(getProjectName('/Users/username/projects/my-app')).toBe('my-app');
      expect(getProjectName('/home/developer/workspace/frontend')).toBe('frontend');
    });

    it('Windowsの絶対パスからプロジェクト名を取得する', () => {
      expect(getProjectName('C:\\Users\\username\\projects\\my-app')).toBe('my-app');
      expect(getProjectName('D:\\Projects\\frontend')).toBe('frontend');
    });

    it('空文字列の場合、"Unknown Project"を返す', () => {
      expect(getProjectName('')).toBe('Unknown Project');
    });
  });

  describe('getProjectPathFromConversation', () => {
    it('一致する会話IDからプロジェクトパスを取得する', () => {
      const currentConversation: Partial<AmazonQConversation> = { conversation_id: 'conv-123' };
      const amazonQHistory: Partial<ConversationMetadata>[] = [
        { conversation_id: 'conv-123', projectPath: '/Users/test/project-1' },
        { conversation_id: 'conv-456', projectPath: '/Users/test/project-2' },
      ];

      const result = getProjectPathFromConversation(
        currentConversation as AmazonQConversation,
        amazonQHistory as ConversationMetadata[]
      );
      expect(result).toBe('/Users/test/project-1');
    });

    it('一致する会話IDが履歴にない場合、空文字列を返す', () => {
      const currentConversation: Partial<AmazonQConversation> = {
        conversation_id: 'conv-nonexistent',
      };
      const amazonQHistory: Partial<ConversationMetadata>[] = [
        { conversation_id: 'conv-123', projectPath: '/project-1' },
        { conversation_id: 'conv-456', projectPath: '/project-2' },
      ];

      const result = getProjectPathFromConversation(
        currentConversation as AmazonQConversation,
        amazonQHistory as ConversationMetadata[]
      );
      expect(result).toBe('');
    });
  });
});
