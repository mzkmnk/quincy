import { signal, computed, WritableSignal, Signal } from '@angular/core';

import { ConnectionState } from '../types';

/**
 * WebSocket接続状態を管理するSignal
 */
export class ConnectionStateManager {
  private connectionState: WritableSignal<ConnectionState> = signal({
    connected: false,
    connecting: false,
    error: null,
  });

  readonly connected: Signal<boolean> = computed(() => this.connectionState().connected);
  readonly connecting: Signal<boolean> = computed(() => this.connectionState().connecting);
  readonly error: Signal<string | null> = computed(() => this.connectionState().error);

  getConnectionState(): WritableSignal<ConnectionState> {
    return this.connectionState;
  }

  setConnectionState(state: ConnectionState): void {
    this.connectionState.set(state);
  }

  updateConnectionState(partialState: Partial<ConnectionState>): void {
    this.connectionState.update(currentState => ({
      ...currentState,
      ...partialState,
    }));
  }
}
