import { projectState } from '../project.state';

/**
 * プロジェクトのエラー状態を設定する
 * @param error エラーメッセージ（nullの場合はエラーをクリア）
 */
export function setProjectError(error: string | null): void {
  projectState.update(state => ({
    ...state,
    error,
    loading: false
  }));
}