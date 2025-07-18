import { projectState } from '../project.state';

/**
 * プロジェクトのローディング状態を設定する
 * @param loading ローディング状態
 */
export function setProjectLoading(loading: boolean): void {
  projectState.update(state => ({
    ...state,
    loading
  }));
}