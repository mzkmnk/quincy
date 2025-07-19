import type { Project } from '@quincy/shared';

import { projectState } from '../project.state';

/**
 * プロジェクトを更新する
 * @param updatedProject 更新するプロジェクト
 */
export function updateProject(updatedProject: Project): void {
  projectState.update(state => ({
    ...state,
    projects: state.projects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    ),
    currentProject: state.currentProject?.id === updatedProject.id 
      ? updatedProject 
      : state.currentProject,
    error: null
  }));
}