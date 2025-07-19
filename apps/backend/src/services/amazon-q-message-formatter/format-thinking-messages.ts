/**
 * AI の思考過程を整形（ToolUse の連続）
 */

import type { ConversationTurn, DisplayMessage } from '../amazon-q-history-types';
import { generateMessageId } from '../../utils/id-generator';

import { formatThinkingContent } from './format-thinking-content';
import { getToolsUsedInThinkingStep } from './get-tools-used-in-thinking-step';

export function formatThinkingMessages(turn: ConversationTurn): DisplayMessage[] {
  const thinkingMessages: DisplayMessage[] = [];
  
  for (let i = 0; i < turn.aiThinking.length; i++) {
    const thinkingContent = turn.aiThinking[i];
    const toolsUsedInThisStep = getToolsUsedInThinkingStep(turn, i);
    
    thinkingMessages.push({
      id: generateMessageId(),
      type: 'thinking',
      content: formatThinkingContent(thinkingContent, toolsUsedInThisStep),
      timestamp: new Date(),
      metadata: {
        toolsUsed: toolsUsedInThisStep,
        messageId: turn.metadata.messageIds[i]
      }
    });
  }
  
  return thinkingMessages;
}