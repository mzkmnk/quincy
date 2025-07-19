import type { Project } from '@quincy/shared';

import { projectState } from '../project.state';

/**
 * プロジェクトリストを設定する
 * @param projects 設定するプロジェクトの配列
 */
export function setProjects(projects: Project[]): void {
  projectState.update(state => ({
    ...state,
    projects,
    loading: false,
    error: null,
  }));
}
