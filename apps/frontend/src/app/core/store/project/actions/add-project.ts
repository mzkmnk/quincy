import type { Project } from '@quincy/shared';

import { projectState } from '../project.state';

/**
 * プロジェクトを追加する
 * @param project 追加するプロジェクト
 */
export function addProject(project: Project): void {
  projectState.update(state => ({
    ...state,
    projects: [...state.projects, project],
    error: null
  }));
}