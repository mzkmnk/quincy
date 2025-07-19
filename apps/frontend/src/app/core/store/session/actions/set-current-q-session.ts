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
 * 現在のAmazon Qセッションを設定する
 * @param qSession 設定するAmazon Qセッション（nullの場合は選択解除）
 */
export function setCurrentQSession(qSession: QSessionStartedEvent | null): void {
  sessionState.update(state => ({
    ...state,
    currentQSession: qSession ? convertQSessionEventToAmazonQSession(qSession) : null,
  }));
}
