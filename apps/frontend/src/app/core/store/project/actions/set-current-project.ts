import type { Project } from '@quincy/shared';

import { projectState } from '../project.state';

/**
 * 現在のプロジェクトを設定する
 * @param project 設定するプロジェクト（nullの場合は選択解除）
 */
export function setCurrentProject(project: Project | null): void {
  projectState.update(state => ({
    ...state,
    currentProject: project
  }));
}