import type { ChatMessage } from '../../../core/store/app.state';

import { generateCurrentDate } from './timestamp-generator';

/**
 * ウェルカムメッセージを生成する
 * @returns ウェルカムメッセージの配列
 */
export function generateWelcomeMessage(): ChatMessage[] {
  return [{
    id: 'welcome',
    content: 'Hello! I\'m Amazon Q, your AI coding assistant. How can I help you with your project today?',
    sender: 'assistant',
    timestamp: generateCurrentDate()
  }];
}