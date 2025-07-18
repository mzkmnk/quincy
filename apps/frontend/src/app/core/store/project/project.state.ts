import { signal, computed } from '@angular/core';
import type { Project } from '@quincy/shared';

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
}

export const projectInitialState: ProjectState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null
};

export const projectState = signal<ProjectState>(projectInitialState);

// Computed selectors
export const projects = computed(() => projectState().projects);
export const currentProject = computed(() => projectState().currentProject);
export const projectLoading = computed(() => projectState().loading);
export const projectError = computed(() => projectState().error);

// Derived selectors
export const hasProjects = computed(() => projects().length > 0);
export const isProjectSelected = computed(() => currentProject() !== null);