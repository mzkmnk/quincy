import { hasProjects } from '../project.state';

/**
 * プロジェクトが存在するかを取得する
 * @returns プロジェクトが存在するかどうか
 */
export function getHasProjects() {
  return hasProjects;
}