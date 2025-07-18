import type { QSessionStartedEvent } from '@quincy/shared';
import { sessionState } from '../session.state';

/**
 * 現在のAmazon Qセッションを設定する
 * @param qSession 設定するAmazon Qセッション（nullの場合は選択解除）
 */
export function setCurrentQSession(qSession: QSessionStartedEvent | null): void {
  sessionState.update(state => ({
    ...state,
    currentQSession: qSession
  }));
}