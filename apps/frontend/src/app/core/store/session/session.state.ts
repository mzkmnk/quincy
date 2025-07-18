import { signal, computed } from '@angular/core';
import type { Session, QSessionStartedEvent } from '@quincy/shared';

export interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  currentQSession: QSessionStartedEvent | null;
  sessionStarting: boolean;
  sessionError: string | null;
}

export const sessionInitialState: SessionState = {
  sessions: [],
  currentSession: null,
  currentQSession: null,
  sessionStarting: false,
  sessionError: null
};

export const sessionState = signal<SessionState>(sessionInitialState);

// Computed selectors
export const sessions = computed(() => sessionState().sessions);
export const currentSession = computed(() => sessionState().currentSession);
export const currentQSession = computed(() => sessionState().currentQSession);
export const sessionStarting = computed(() => sessionState().sessionStarting);
export const sessionError = computed(() => sessionState().sessionError);

// Derived selectors
export const hasSessions = computed(() => sessions().length > 0);
export const isSessionSelected = computed(() => currentSession() !== null);
export const isQSessionActive = computed(() => currentQSession() !== null);