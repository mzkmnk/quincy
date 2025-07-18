import { projectState } from '../project.state';

/**
 * プロジェクトを削除する
 * @param projectId 削除するプロジェクトのID
 */
export function removeProject(projectId: string): void {
  projectState.update(state => ({
    ...state,
    projects: state.projects.filter(p => p.id !== projectId),
    currentProject: state.currentProject?.id === projectId 
      ? null 
      : state.currentProject,
    error: null
  }));
}