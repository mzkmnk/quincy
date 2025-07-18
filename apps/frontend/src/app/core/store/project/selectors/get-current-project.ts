import { currentProject } from '../project.state';

/**
 * 現在のプロジェクトを取得する
 * @returns 現在のプロジェクト
 */
export function getCurrentProject() {
  return currentProject;
}