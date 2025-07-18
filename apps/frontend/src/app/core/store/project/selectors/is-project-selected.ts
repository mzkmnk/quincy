import { isProjectSelected } from '../project.state';

/**
 * プロジェクトが選択されているかを取得する
 * @returns プロジェクトが選択されているかどうか
 */
export function getIsProjectSelected() {
  return isProjectSelected;
}