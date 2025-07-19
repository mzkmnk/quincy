import { amazonQHistoryState } from '../amazon-q-history.state';

/**
 * Amazon Q履歴のローディング状態を設定する
 * @param loading ローディング状態
 */
export function setQHistoryLoading(loading: boolean): void {
  amazonQHistoryState.update(state => ({
    ...state,
    qHistoryLoading: loading,
  }));
}
