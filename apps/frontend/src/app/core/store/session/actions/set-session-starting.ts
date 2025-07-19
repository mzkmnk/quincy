import { sessionState } from '../session.state';

/**
 * セッション開始状態を設定する
 * @param starting セッション開始状態
 */
export function setSessionStarting(starting: boolean): void {
  sessionState.update(state => ({
    ...state,
    sessionStarting: starting,
  }));
}
