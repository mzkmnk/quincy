import type { QSessionStartedEvent } from '@quincy/shared';
import type { AmazonQSession } from '../../../types/amazon-q.types';

import { sessionState } from '../session.state';

/**
 * QSessionStartedEventをAmazonQSessionに変換する
 * @param event QSessionStartedEvent
 * @returns AmazonQSession
 */
function convertQSessionEventToAmazonQSession(event: QSessionStartedEvent): AmazonQSession {
  const now = new Date();
  // プロジェクト名をパスから抽出
  const projectName = event.projectPath.split('/').pop() || 'Unknown Project';
  
  return {
    sessionId: event.sessionId,
    projectId: projectName, // プロジェクト名をprojectIdとして使用
    projectPath: event.projectPath,
    projectName: projectName,
    status: 'active', // 開始イベントなのでactiveステータス
    startedAt: now,
    lastActivity: now,
    totalMessages: 0, // 初期値
    totalTokens: 0, // 初期値
  };
}

/**
 * アクティブセッションに切り替える
 * @param qSession 切り替える先のAmazon Qセッション
 */
export function switchToActiveSession(qSession: QSessionStartedEvent): void {
  sessionState.update(state => ({
    ...state,
    currentQSession: convertQSessionEventToAmazonQSession(qSession),
    sessionStarting: false,
    sessionError: null,
  }));
}
