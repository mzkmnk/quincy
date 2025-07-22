/**
 * プロンプト準備完了イベントの処理
 * Amazon Q CLIが`>`プロンプトを表示し、ユーザー入力を待機中であることを処理
 */

import { chatStateManager } from '../../../store/chat/actions';

interface PromptReadyEvent {
  sessionId: string;
  timestamp: number;
  status: 'ready';
}

export function handlePromptReady(data: PromptReadyEvent): void {
  console.debug('Amazon Q CLI prompt ready:', data);

  // 統合状態管理を使用してプロンプト準備完了状態に更新
  chatStateManager.setPromptReady(data.sessionId);
}
