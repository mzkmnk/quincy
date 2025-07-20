/**
 * メタデータを抽出
 */

import type { ConversationTurn, HistoryEntry } from '../amazon-q-history-types';

import { extractEnvironmentInfo } from './extract-environment-info';
import { extractToolsUsed } from './extract-tools-used';
import { extractMessageIds } from './extract-message-ids';

export function extractMetadata(
  entries: HistoryEntry[],
  startIndex: number,
  endIndex: number
): ConversationTurn['metadata'] {
  const environmentInfo = extractEnvironmentInfo(entries);
  const toolsUsed = extractToolsUsed(entries);
  const messageIds = extractMessageIds(entries);

  return {
    environmentInfo,
    toolsUsed,
    messageIds,
    turnStartIndex: startIndex,
    turnEndIndex: endIndex,
  };
}
