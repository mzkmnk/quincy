import { signal, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import type { Project, Session } from '@quincy/shared';

export interface AppState {
  projects: Project[];
  currentProject: Project | null;
  sessions: Session[];
  currentSession: Session | null;
  loading: boolean;
  error: string | null;
}

const initialState: AppState = {
  projects: [],
  currentProject: null,
  sessions: [],
  currentSession: null,
  loading: false,
  error: null
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ projects, currentProject, sessions, currentSession }) => ({
    hasProjects: computed(() => projects().length > 0),
    hasSessions: computed(() => sessions().length > 0),
    currentProjectSessions: computed(() => {
      const projectId = currentProject()?.id;
      return projectId ? sessions().filter(s => s.projectId === projectId) : [];
    }),
    isProjectSelected: computed(() => currentProject() !== null),
    isSessionSelected: computed(() => currentSession() !== null),
  })),
  withMethods((store) => ({
    setProjects: (projects: Project[]) => {
      patchState(store, { projects, loading: false, error: null });
    },
    setCurrentProject: (project: Project | null) => {
      patchState(store, { currentProject: project });
    },
    setSessions: (sessions: Session[]) => {
      patchState(store, { sessions, loading: false, error: null });
    },
    setCurrentSession: (session: Session | null) => {
      patchState(store, { currentSession: session });
    },
    setLoading: (loading: boolean) => {
      patchState(store, { loading });
    },
    setError: (error: string | null) => {
      patchState(store, { error, loading: false });
    },
    addProject: (project: Project) => {
      patchState(store, { 
        projects: [...store.projects(), project],
        error: null 
      });
    },
    addSession: (session: Session) => {
      patchState(store, { 
        sessions: [...store.sessions(), session],
        error: null 
      });
    },
    clearError: () => {
      patchState(store, { error: null });
    }
  }))
);