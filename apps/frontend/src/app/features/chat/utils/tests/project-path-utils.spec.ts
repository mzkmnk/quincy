import { getProjectName, getProjectPathFromConversation } from '../project-path-utils';

describe('project-path-utils', () => {
  describe('getProjectName', () => {
    describe('有効なプロジェクトパスの処理', () => {
      it('Unix/Linux/Macの絶対パスからプロジェクト名を取得する', () => {
        expect(getProjectName('/Users/username/projects/my-app')).toBe('my-app');
        expect(getProjectName('/home/developer/workspace/frontend')).toBe('frontend');
        expect(getProjectName('/var/www/html')).toBe('html');
        expect(getProjectName('/opt/app')).toBe('app');
      });

      it('Windowsの絶対パスからプロジェクト名を取得する', () => {
        expect(getProjectName('C:\\Users\\username\\projects\\my-app')).toBe('my-app');
        expect(getProjectName('D:\\Projects\\frontend')).toBe('frontend');
        expect(getProjectName('E:\\workspace\\test-project')).toBe('test-project');
      });

      it('相対パスからプロジェクト名を取得する', () => {
        expect(getProjectName('projects/my-app')).toBe('my-app');
        expect(getProjectName('./current-project')).toBe('current-project');
        expect(getProjectName('../parent-project')).toBe('parent-project');
      });

      it('スラッシュで終わるパスを正しく処理する', () => {
        expect(getProjectName('/Users/username/projects/my-app/')).toBe('my-app');
        expect(getProjectName('/path/to/project/')).toBe('project');
        expect(getProjectName('C:\\Projects\\app\\')).toBe('app');
      });

      it('複数の連続するスラッシュがあっても正しく処理する', () => {
        expect(getProjectName('/Users/username//projects///my-app')).toBe('my-app');
        expect(getProjectName('/path///to//project')).toBe('project');
      });

      it('特殊文字を含むプロジェクト名を正しく取得する', () => {
        expect(getProjectName('/Users/username/projects/my-app-v2')).toBe('my-app-v2');
        expect(getProjectName('/path/to/project_with_underscores')).toBe(
          'project_with_underscores'
        );
        expect(getProjectName('/path/to/project with spaces')).toBe('project with spaces');
        expect(getProjectName('/path/to/project.with.dots')).toBe('project.with.dots');
        expect(getProjectName('/path/to/project@version')).toBe('project@version');
      });

      it('Unicode文字を含むプロジェクト名を正しく取得する', () => {
        expect(getProjectName('/Users/ユーザー/プロジェクト')).toBe('プロジェクト');
        expect(getProjectName('/Users/用户/项目')).toBe('项目');
        expect(getProjectName('/Users/пользователь/проект')).toBe('проект');
        expect(getProjectName('/path/to/🚀-rocket-project')).toBe('🚀-rocket-project');
      });

      it('数字のみのプロジェクト名を正しく取得する', () => {
        expect(getProjectName('/path/to/123')).toBe('123');
        expect(getProjectName('/projects/2024')).toBe('2024');
      });
    });

    describe('エッジケースの処理', () => {
      it('ルートパス（"/"）の場合、パス全体を返す', () => {
        expect(getProjectName('/')).toBe('/');
      });

      it('Windowsのドライブルート（"C:\\"）の場合、パス全体を返す', () => {
        expect(getProjectName('C:\\')).toBe('C:\\');
        expect(getProjectName('D:\\')).toBe('D:\\');
      });

      it('パスセパレーターがない場合、パス全体をプロジェクト名として返す', () => {
        expect(getProjectName('project-name')).toBe('project-name');
        expect(getProjectName('simple')).toBe('simple');
        expect(getProjectName('123')).toBe('123');
      });

      it('非常に長いプロジェクト名を正しく取得する', () => {
        const longProjectName = 'very-long-project-name-' + 'x'.repeat(100);
        const longPath = `/path/to/${longProjectName}`;
        expect(getProjectName(longPath)).toBe(longProjectName);
      });

      it('空のディレクトリ名がある場合の処理', () => {
        // 最後の空要素は無視され、その前の要素が返される
        expect(getProjectName('/path/to/project/')).toBe('project');
        expect(getProjectName('/path/to/project//')).toBe('project');
      });
    });

    describe('無効な入力の処理', () => {
      it('空文字列の場合、"Unknown Project"を返す', () => {
        expect(getProjectName('')).toBe('Unknown Project');
      });

      it('nullの場合、"Unknown Project"を返す', () => {
        expect(getProjectName(null as any)).toBe('Unknown Project');
      });

      it('undefinedの場合、"Unknown Project"を返す', () => {
        expect(getProjectName(undefined as any)).toBe('Unknown Project');
      });

      it('空白のみの場合も"Unknown Project"を返す', () => {
        expect(getProjectName('   ')).toBe('Unknown Project');
        expect(getProjectName('\t\n\r')).toBe('Unknown Project');
      });
    });

    describe('パフォーマンス', () => {
      it('大量のパス処理でも効率的に動作する', () => {
        const paths = Array.from({ length: 1000 }, (_, i) => `/path/to/project-${i}`);

        const start = performance.now();
        paths.forEach(path => getProjectName(path));
        const end = performance.now();

        expect(end - start).toBeLessThan(50); // 50ms以内
      });

      it('非常に長いパスでも効率的に処理する', () => {
        const longPath = '/very/' + 'long/'.repeat(1000) + 'project';

        const start = performance.now();
        const result = getProjectName(longPath);
        const end = performance.now();

        expect(end - start).toBeLessThan(10); // 10ms以内
        expect(result).toBe('project');
      });
    });
  });

  describe('getProjectPathFromConversation', () => {
    describe('正常なケース', () => {
      it('一致する会話IDからプロジェクトパスを取得する', () => {
        const currentConversation = { conversation_id: 'conv-123' };
        const amazonQHistory = [
          { conversation_id: 'conv-123', projectPath: '/Users/test/project-1' },
          { conversation_id: 'conv-456', projectPath: '/Users/test/project-2' },
        ];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('/Users/test/project-1');
      });

      it('複数の履歴から正しい会話を見つける', () => {
        const currentConversation = { conversation_id: 'conv-456' };
        const amazonQHistory = [
          { conversation_id: 'conv-123', projectPath: '/project-1' },
          { conversation_id: 'conv-456', projectPath: '/project-2' },
          { conversation_id: 'conv-789', projectPath: '/project-3' },
        ];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('/project-2');
      });

      it('特殊文字を含むプロジェクトパスを正しく取得する', () => {
        const currentConversation = { conversation_id: 'conv-special' };
        const amazonQHistory = [
          {
            conversation_id: 'conv-special',
            projectPath: '/Users/test/project with spaces & special chars!@#',
          },
        ];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('/Users/test/project with spaces & special chars!@#');
      });

      it('Unicode文字を含むプロジェクトパスを正しく取得する', () => {
        const currentConversation = { conversation_id: 'conv-unicode' };
        const amazonQHistory = [
          { conversation_id: 'conv-unicode', projectPath: '/Users/ユーザー/プロジェクト-🚀' },
        ];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('/Users/ユーザー/プロジェクト-🚀');
      });

      it('複雑な会話オブジェクトでも正常に動作する', () => {
        const currentConversation = {
          conversation_id: 'conv-complex',
          title: 'Complex Conversation',
          timestamp: Date.now(),
          metadata: { type: 'chat' },
        };
        const amazonQHistory = [
          {
            conversation_id: 'conv-complex',
            projectPath: '/complex/project',
            title: 'History Item',
            created: Date.now(),
          },
        ];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('/complex/project');
      });
    });

    describe('会話が見つからないケース', () => {
      it('currentConversationがnullの場合、空文字列を返す', () => {
        const currentConversation = null;
        const amazonQHistory = [{ conversation_id: 'conv-123', projectPath: '/project-1' }];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('');
      });

      it('currentConversationがundefinedの場合、空文字列を返す', () => {
        const currentConversation = undefined;
        const amazonQHistory = [{ conversation_id: 'conv-123', projectPath: '/project-1' }];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('');
      });

      it('一致する会話IDが履歴にない場合、空文字列を返す', () => {
        const currentConversation = { conversation_id: 'conv-nonexistent' };
        const amazonQHistory = [
          { conversation_id: 'conv-123', projectPath: '/project-1' },
          { conversation_id: 'conv-456', projectPath: '/project-2' },
        ];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('');
      });

      it('amazonQHistoryが空配列の場合、空文字列を返す', () => {
        const currentConversation = { conversation_id: 'conv-123' };
        const amazonQHistory: any[] = [];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('');
      });

      it('履歴アイテムにprojectPathがない場合、空文字列を返す', () => {
        const currentConversation = { conversation_id: 'conv-123' };
        const amazonQHistory = [
          { conversation_id: 'conv-123' }, // projectPathプロパティなし
        ];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('');
      });

      it('履歴アイテムのprojectPathがundefinedの場合、空文字列を返す', () => {
        const currentConversation = { conversation_id: 'conv-123' };
        const amazonQHistory = [{ conversation_id: 'conv-123', projectPath: undefined }];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('');
      });

      it('履歴アイテムのprojectPathがnullの場合、空文字列を返す', () => {
        const currentConversation = { conversation_id: 'conv-123' };
        const amazonQHistory = [{ conversation_id: 'conv-123', projectPath: null }];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('');
      });
    });

    describe('エッジケース', () => {
      it('currentConversationにconversation_idがない場合、空文字列を返す', () => {
        const currentConversation = { id: 'conv-123' }; // conversation_idではなくid
        const amazonQHistory = [{ conversation_id: 'conv-123', projectPath: '/project-1' }];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('');
      });

      it('conversation_idが空文字列の場合、正しく処理する', () => {
        const currentConversation = { conversation_id: '' };
        const amazonQHistory = [{ conversation_id: '', projectPath: '/empty-id-project' }];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('/empty-id-project');
      });

      it('conversation_idがnullの場合、見つからないとして処理する', () => {
        const currentConversation = { conversation_id: null };
        const amazonQHistory = [{ conversation_id: 'conv-123', projectPath: '/project-1' }];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('');
      });

      it('重複するconversation_idがある場合、最初に見つかったものを返す', () => {
        const currentConversation = { conversation_id: 'conv-duplicate' };
        const amazonQHistory = [
          { conversation_id: 'conv-duplicate', projectPath: '/first-project' },
          { conversation_id: 'conv-duplicate', projectPath: '/second-project' },
        ];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('/first-project');
      });

      it('projectPathが空文字列の場合、空文字列を返す', () => {
        const currentConversation = { conversation_id: 'conv-123' };
        const amazonQHistory = [{ conversation_id: 'conv-123', projectPath: '' }];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('');
      });

      it('非文字列のprojectPathの場合の動作', () => {
        const currentConversation = { conversation_id: 'conv-123' };
        const amazonQHistory = [{ conversation_id: 'conv-123', projectPath: 123 as any }];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe(123);
      });
    });

    describe('パフォーマンス', () => {
      it('大量の履歴でも効率的に検索する', () => {
        const currentConversation = { conversation_id: 'conv-target' };
        const amazonQHistory = Array.from({ length: 10000 }, (_, i) => ({
          conversation_id: `conv-${i}`,
          projectPath: `/project-${i}`,
        }));
        // ターゲットを中央に配置
        amazonQHistory[5000] = { conversation_id: 'conv-target', projectPath: '/target-project' };

        const start = performance.now();
        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        const end = performance.now();

        expect(end - start).toBeLessThan(50); // 50ms以内
        expect(result).toBe('/target-project');
      });

      it('見つからない場合でも効率的に処理する', () => {
        const currentConversation = { conversation_id: 'conv-nonexistent' };
        const amazonQHistory = Array.from({ length: 1000 }, (_, i) => ({
          conversation_id: `conv-${i}`,
          projectPath: `/project-${i}`,
        }));

        const start = performance.now();
        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        const end = performance.now();

        expect(end - start).toBeLessThan(20); // 20ms以内
        expect(result).toBe('');
      });
    });

    describe('実際の使用シナリオ', () => {
      it('チャット履歴から現在の会話のプロジェクトパスを取得', () => {
        const currentConversation = { conversation_id: 'chat-session-456' };
        const amazonQHistory = [
          {
            conversation_id: 'chat-session-123',
            projectPath: '/Users/dev/old-project',
            title: 'Previous Chat',
            timestamp: Date.now() - 86400000,
          },
          {
            conversation_id: 'chat-session-456',
            projectPath: '/Users/dev/current-project',
            title: 'Current Chat',
            timestamp: Date.now(),
          },
        ];

        const result = getProjectPathFromConversation(currentConversation, amazonQHistory);
        expect(result).toBe('/Users/dev/current-project');
      });

      it('複数プロジェクト間での会話切り替え', () => {
        const conversations = [
          { conversation_id: 'frontend-chat' },
          { conversation_id: 'backend-chat' },
          { conversation_id: 'mobile-chat' },
        ];

        const amazonQHistory = [
          { conversation_id: 'frontend-chat', projectPath: '/projects/frontend' },
          { conversation_id: 'backend-chat', projectPath: '/projects/backend' },
          { conversation_id: 'mobile-chat', projectPath: '/projects/mobile' },
        ];

        conversations.forEach((conv, index) => {
          const result = getProjectPathFromConversation(conv, amazonQHistory);
          expect(result).toBe(amazonQHistory[index].projectPath);
        });
      });
    });
  });

  describe('関数間の連携テスト', () => {
    it('getProjectPathFromConversationとgetProjectNameの連携', () => {
      const currentConversation = { conversation_id: 'conv-integration' };
      const amazonQHistory = [
        { conversation_id: 'conv-integration', projectPath: '/Users/dev/my-awesome-project' },
      ];

      const projectPath = getProjectPathFromConversation(currentConversation, amazonQHistory);
      const projectName = getProjectName(projectPath);

      expect(projectPath).toBe('/Users/dev/my-awesome-project');
      expect(projectName).toBe('my-awesome-project');
    });

    it('プロジェクトパスが見つからない場合の連携', () => {
      const currentConversation = { conversation_id: 'conv-missing' };
      const amazonQHistory: any[] = [];

      const projectPath = getProjectPathFromConversation(currentConversation, amazonQHistory);
      const projectName = getProjectName(projectPath);

      expect(projectPath).toBe('');
      expect(projectName).toBe('Unknown Project');
    });
  });
});
