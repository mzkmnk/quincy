/**
 * 特定の思考ステップで使用されたツールを取得
 */

import type { ConversationTurn, ToolUse } from '../amazon-q-history-types';

export function getToolsUsedInThinkingStep(turn: ConversationTurn, stepIndex: number): ToolUse[] {
  // 簡易的な実装: 全ツールを均等に分配
  const toolsPerStep = Math.ceil(turn.metadata.toolsUsed.length / turn.aiThinking.length);
  const startIndex = stepIndex * toolsPerStep;
  const endIndex = Math.min(startIndex + toolsPerStep, turn.metadata.toolsUsed.length);
  
  return turn.metadata.toolsUsed.slice(startIndex, endIndex);
}