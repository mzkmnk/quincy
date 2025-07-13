import { signal, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import type { Project, Session, ConversationMetadata, AmazonQConversation, QSessionStartedEvent } from '@quincy/shared';

export interface AppState {
  projects: Project[];
  currentProject: Project | null;
  sessions: Session[];
  currentSession: Session | null;
  amazonQHistory: ConversationMetadata[];
  currentQConversation: AmazonQConversation | null;
  currentQSession: QSessionStartedEvent | null;
  qHistoryLoading: boolean;
  sessionStarting: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AppState = {
  projects: [],
  currentProject: null,
  sessions: [],
  currentSession: null,
  amazonQHistory: [],
  currentQConversation: null,
  currentQSession: null,
  qHistoryLoading: false,
  sessionStarting: false,
  loading: false,
  error: null
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ projects, currentProject, sessions, currentSession, amazonQHistory, currentQConversation, currentQSession, qHistoryLoading, sessionStarting }) => ({
    hasProjects: computed(() => projects().length > 0),
    hasSessions: computed(() => sessions().length > 0),
    hasAmazonQHistory: computed(() => amazonQHistory().length > 0),
    currentProjectSessions: computed(() => {
      const projectId = currentProject()?.id;
      return projectId ? sessions().filter(s => s.projectId === projectId) : [];
    }),
    currentProjectQHistory: computed(() => {
      const projectPath = currentProject()?.path;
      return projectPath ? amazonQHistory().filter(h => h.projectPath === projectPath) : [];
    }),
    isProjectSelected: computed(() => currentProject() !== null),
    isSessionSelected: computed(() => currentSession() !== null),
    isQConversationSelected: computed(() => currentQConversation() !== null),
    isQSessionActive: computed(() => currentQSession() !== null),
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
    updateProject: (updatedProject: Project) => {
      patchState(store, {
        projects: store.projects().map(p => 
          p.id === updatedProject.id ? updatedProject : p
        ),
        currentProject: store.currentProject()?.id === updatedProject.id 
          ? updatedProject 
          : store.currentProject(),
        error: null
      });
    },
    removeProject: (projectId: string) => {
      patchState(store, {
        projects: store.projects().filter(p => p.id !== projectId),
        currentProject: store.currentProject()?.id === projectId 
          ? null 
          : store.currentProject(),
        error: null
      });
    },
    addSession: (session: Session) => {
      patchState(store, { 
        sessions: [...store.sessions(), session],
        error: null 
      });
    },
    setAmazonQHistory: (amazonQHistory: ConversationMetadata[]) => {
      patchState(store, { amazonQHistory, qHistoryLoading: false, error: null });
    },
    setCurrentQConversation: (currentQConversation: AmazonQConversation | null) => {
      patchState(store, { currentQConversation });
    },
    setQHistoryLoading: (qHistoryLoading: boolean) => {
      patchState(store, { qHistoryLoading });
    },
    addQHistoryItem: (item: ConversationMetadata) => {
      patchState(store, {
        amazonQHistory: [...store.amazonQHistory(), item],
        error: null
      });
    },
    clearError: () => {
      patchState(store, { error: null });
    },
    setCurrentQSession: (currentQSession: QSessionStartedEvent | null) => {
      patchState(store, { currentQSession });
    },
    setSessionStarting: (sessionStarting: boolean) => {
      patchState(store, { sessionStarting });
    }
  }))
);