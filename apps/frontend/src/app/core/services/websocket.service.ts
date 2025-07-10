import { Injectable, Signal, WritableSignal, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connectionState: WritableSignal<ConnectionState> = signal({
    connected: false,
    connecting: false,
    error: null
  });

  readonly connected: Signal<boolean> = computed(() => this.connectionState().connected);
  readonly connecting: Signal<boolean> = computed(() => this.connectionState().connecting);
  readonly error: Signal<string | null> = computed(() => this.connectionState().error);

  private readonly backendUrl = 'http://localhost:3000';

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.connectionState.set({ connected: false, connecting: true, error: null });

    this.socket = io(this.backendUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      this.connectionState.set({ connected: true, connecting: false, error: null });
    });

    this.socket.on('disconnect', () => {
      this.connectionState.set({ connected: false, connecting: false, error: null });
    });

    this.socket.on('connect_error', (error) => {
      this.connectionState.set({ 
        connected: false, 
        connecting: false, 
        error: error.message || 'Connection failed' 
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState.set({ connected: false, connecting: false, error: null });
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}