/**
 * Amazon Q CLI メッセージの整形処理
 */

import { 
  ConversationTurn, 
  DisplayMessage, 
  ToolUse,
  EnvironmentState
} from './amazon-q-history-types';
import { logger } from '../utils/logger';

export class MessageFormatter {
  /**
   * ConversationTurnをDisplayMessage配列に変換
   */
  convertToDisplayMessages(turns: ConversationTurn[]): DisplayMessage[] {
    const displayMessages: DisplayMessage[] = [];
    
    for (const turn of turns) {
      try {
        // ユーザーメッセージを追加
        const userMessage = this.formatUserMessage(turn);
        displayMessages.push(userMessage);
        
        // AI の思考過程を追加（ToolUse の連続）
        const thinkingMessages = this.formatThinkingMessages(turn);
        displayMessages.push(...thinkingMessages);
        
        // AI の最終回答を追加
        const aiResponse = this.formatAIResponse(turn);
        displayMessages.push(aiResponse);
        
      } catch (error) {
        logger.error('Failed to format conversation turn', { 
          error: error instanceof Error ? error.message : String(error),
          turnStartIndex: turn.metadata.turnStartIndex,
          turnEndIndex: turn.metadata.turnEndIndex
        });
        
        // エラーが発生した場合もエラーメッセージを表示
        displayMessages.push({
          id: this.generateMessageId(),
          type: 'assistant',
          content: 'メッセージの表示中にエラーが発生しました',
          timestamp: new Date()
        });
      }
    }
    
    return displayMessages;
  }

  /**
   * ユーザーメッセージを整形
   */
  private formatUserMessage(turn: ConversationTurn): DisplayMessage {
    return {
      id: this.generateMessageId(),
      type: 'user',
      content: turn.userMessage,
      timestamp: new Date(),
      metadata: {
        environmentInfo: turn.metadata.environmentInfo
      }
    };
  }

  /**
   * AI の思考過程を整形（ToolUse の連続）
   */
  private formatThinkingMessages(turn: ConversationTurn): DisplayMessage[] {
    const thinkingMessages: DisplayMessage[] = [];
    
    for (let i = 0; i < turn.aiThinking.length; i++) {
      const thinkingContent = turn.aiThinking[i];
      const toolsUsedInThisStep = this.getToolsUsedInThinkingStep(turn, i);
      
      thinkingMessages.push({
        id: this.generateMessageId(),
        type: 'thinking',
        content: this.formatThinkingContent(thinkingContent, toolsUsedInThisStep),
        timestamp: new Date(),
        metadata: {
          toolsUsed: toolsUsedInThisStep,
          messageId: turn.metadata.messageIds[i]
        }
      });
    }
    
    return thinkingMessages;
  }

  /**
   * AI の最終回答を整形
   */
  private formatAIResponse(turn: ConversationTurn): DisplayMessage {
    const lastMessageId = turn.metadata.messageIds[turn.metadata.messageIds.length - 1];
    
    return {
      id: this.generateMessageId(),
      type: 'assistant',
      content: turn.aiResponse,
      timestamp: new Date(),
      metadata: {
        environmentInfo: turn.metadata.environmentInfo,
        toolsUsed: turn.metadata.toolsUsed,
        messageId: lastMessageId
      }
    };
  }

  /**
   * 思考内容を整形
   */
  private formatThinkingContent(content: string, toolsUsed: ToolUse[]): string {
    let formattedContent = content;
    
    // ツール使用情報を追加
    if (toolsUsed.length > 0) {
      const toolNames = toolsUsed.map(tool => tool.name).join(', ');
      formattedContent += `\n\n🔧 使用ツール: ${toolNames}`;
    }
    
    return formattedContent;
  }

  /**
   * 特定の思考ステップで使用されたツールを取得
   */
  private getToolsUsedInThinkingStep(turn: ConversationTurn, stepIndex: number): ToolUse[] {
    // 簡易的な実装: 全ツールを均等に分配
    const toolsPerStep = Math.ceil(turn.metadata.toolsUsed.length / turn.aiThinking.length);
    const startIndex = stepIndex * toolsPerStep;
    const endIndex = Math.min(startIndex + toolsPerStep, turn.metadata.toolsUsed.length);
    
    return turn.metadata.toolsUsed.slice(startIndex, endIndex);
  }

  /**
   * 環境情報を読みやすい形式に整形
   */
  formatEnvironmentInfo(environmentInfo: EnvironmentState): string {
    const lines = [
      `💻 OS: ${environmentInfo.operating_system}`,
      `📁 作業ディレクトリ: ${environmentInfo.current_working_directory}`
    ];
    
    if (environmentInfo.environment_variables.length > 0) {
      lines.push(`🔧 環境変数: ${environmentInfo.environment_variables.length}個`);
    }
    
    return lines.join('\n');
  }

  /**
   * ツール使用情報を読みやすい形式に整形
   */
  formatToolsUsed(toolsUsed: ToolUse[]): string {
    if (toolsUsed.length === 0) {
      return 'ツールは使用されませんでした';
    }
    
    const toolSummary = toolsUsed.map(tool => {
      const argsSummary = Object.keys(tool.args).length > 0 
        ? ` (${Object.keys(tool.args).length}個の引数)`
        : '';
      return `• ${tool.name}${argsSummary}`;
    }).join('\n');
    
    return `🔧 使用されたツール:\n${toolSummary}`;
  }

  /**
   * 統計情報を整形
   */
  formatStats(stats: {
    totalEntries: number;
    totalTurns: number;
    averageToolUsesPerTurn: number;
    totalToolUses: number;
  }): string {
    return [
      `📊 会話の統計情報:`,
      `• 総エントリー数: ${stats.totalEntries}`,
      `• 会話ターン数: ${stats.totalTurns}`,
      `• 総ツール使用回数: ${stats.totalToolUses}`,
      `• 1ターン平均ツール使用回数: ${stats.averageToolUsesPerTurn.toFixed(1)}`
    ].join('\n');
  }

  /**
   * メッセージIDを生成
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 長いコンテンツを適切に切り詰める
   */
  truncateContent(content: string, maxLength: number = 1000): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * マークダウン形式の簡易サポート
   */
  formatMarkdown(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  /**
   * 表示設定に基づいてメッセージをフィルタリング
   */
  filterMessages(
    messages: DisplayMessage[], 
    options: {
      showThinking?: boolean;
      showEnvironmentInfo?: boolean;
      showToolsUsed?: boolean;
    }
  ): DisplayMessage[] {
    const { showThinking = true, showEnvironmentInfo = true, showToolsUsed = true } = options;
    
    return messages.filter(message => {
      if (message.type === 'thinking' && !showThinking) {
        return false;
      }
      
      if (message.metadata?.environmentInfo && !showEnvironmentInfo) {
        // 環境情報を削除
        delete message.metadata.environmentInfo;
      }
      
      if (message.metadata?.toolsUsed && !showToolsUsed) {
        // ツール情報を削除
        delete message.metadata.toolsUsed;
      }
      
      return true;
    });
  }
}