import { connectedUsers } from './connection-map';

export function getUserCount(): number {
  return connectedUsers.size;
}