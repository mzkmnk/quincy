import { signal, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';
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
      store.patchState({ projects, loading: false, error: null });
    },
    setCurrentProject: (project: Project | null) => {
      store.patchState({ currentProject: project });
    },
    setSessions: (sessions: Session[]) => {
      store.patchState({ sessions, loading: false, error: null });
    },
    setCurrentSession: (session: Session | null) => {
      store.patchState({ currentSession: session });
    },
    setLoading: (loading: boolean) => {
      store.patchState({ loading });
    },
    setError: (error: string | null) => {
      store.patchState({ error, loading: false });
    },
    addProject: (project: Project) => {
      store.patchState({ 
        projects: [...store.projects(), project],
        error: null 
      });
    },
    addSession: (session: Session) => {
      store.patchState({ 
        sessions: [...store.sessions(), session],
        error: null 
      });
    },
    clearError: () => {
      store.patchState({ error: null });
    }
  }))
);