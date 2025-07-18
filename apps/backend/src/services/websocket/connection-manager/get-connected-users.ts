import type { ConnectionInfo } from '@quincy/shared';
import { connectedUsers } from './connection-map';

export function getConnectedUsers(): ConnectionInfo[] {
  return Array.from(connectedUsers.values());
}