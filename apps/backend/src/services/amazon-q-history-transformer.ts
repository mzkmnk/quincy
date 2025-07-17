/**
 * Amazon Q CLI historyデータの変換処理
 */

import { 
  HistoryData, 
  HistoryEntry, 
  ConversationTurn, 
  HistoryInputMessage, 
  HistoryResponseMessage,
  HistoryInputContent,
  HistoryResponseContent,
  ToolUse,
  EnvironmentState,
  isPromptMessage,
  isToolUseResultsMessage,
  isCancelledToolUsesMessage,
  isToolUseResponse,
  isResponse
} from './amazon-q-history-types';

export class HistoryTransformer {
  /**
   * historyデータを会話ターンにグループ化
   * Responseが来るまでを1つのターンとして処理
   */
  groupConversationTurns(historyData: HistoryData): ConversationTurn[] {
    const turns: ConversationTurn[] = [];
    const entries = historyData.history;
    
    let currentTurnEntries: HistoryEntry[] = [];
    let startIndex = 0;
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      currentTurnEntries.push(entry);
      
      // 応答がResponseキーを持つ場合、ターン終了
      if (isResponse(entry[1])) {
        try {
          const turn = this.createConversationTurn(currentTurnEntries, startIndex, i);
          turns.push(turn);
          currentTurnEntries = [];
          startIndex = i + 1;
        } catch (error) {
          // エラーが発生した場合も次のターンに進む
          currentTurnEntries = [];
          startIndex = i + 1;
        }
      }
    }
    
    // 最後のターンが未完了の場合（Responseがない場合）
    if (currentTurnEntries.length > 0) {
      try {
        const turn = this.createConversationTurn(currentTurnEntries, startIndex, entries.length - 1);
        turns.push(turn);
      } catch (error) {
      }
    }
    
    return turns;
  }

  /**
   * 複数のHistoryEntryから1つのConversationTurnを作成
   */
  private createConversationTurn(
    entries: HistoryEntry[], 
    startIndex: number, 
    endIndex: number
  ): ConversationTurn {
    const userMessage = this.extractUserMessage(entries);
    const aiThinking = this.extractAIThinking(entries);
    const aiResponse = this.extractAIResponse(entries);
    const metadata = this.extractMetadata(entries, startIndex, endIndex);
    
    return {
      userMessage,
      aiThinking,
      aiResponse,
      metadata
    };
  }

  /**
   * ユーザーメッセージを抽出
   * 最初のPromptメッセージを探す
   */
  private extractUserMessage(entries: HistoryEntry[]): string {
    for (const entry of entries) {
      const [inputMessage] = entry;
      if (isPromptMessage(inputMessage.content)) {
        return inputMessage.content.Prompt.prompt;
      }
    }
    return 'No user message found';
  }

  /**
   * AI の思考過程を抽出（ToolUse の連続）
   */
  private extractAIThinking(entries: HistoryEntry[]): string[] {
    const thinking: string[] = [];
    
    for (const entry of entries) {
      const [, responseMessage] = entry;
      if (isToolUseResponse(responseMessage)) {
        thinking.push(responseMessage.ToolUse.content);
      }
    }
    
    return thinking;
  }

  /**
   * AI の最終回答を抽出
   */
  private extractAIResponse(entries: HistoryEntry[]): string {
    // 最後のエントリから順番に探す
    for (let i = entries.length - 1; i >= 0; i--) {
      const [, responseMessage] = entries[i];
      if (isResponse(responseMessage)) {
        return responseMessage.Response.content;
      }
    }
    
    // Responseがない場合は最後のToolUseを使用
    for (let i = entries.length - 1; i >= 0; i--) {
      const [, responseMessage] = entries[i];
      if (isToolUseResponse(responseMessage)) {
        return responseMessage.ToolUse.content;
      }
    }
    
    return 'No AI response found';
  }

  /**
   * メタデータを抽出
   */
  private extractMetadata(
    entries: HistoryEntry[], 
    startIndex: number, 
    endIndex: number
  ): ConversationTurn['metadata'] {
    const environmentInfo = this.extractEnvironmentInfo(entries);
    const toolsUsed = this.extractToolsUsed(entries);
    const messageIds = this.extractMessageIds(entries);
    
    return {
      environmentInfo,
      toolsUsed,
      messageIds,
      turnStartIndex: startIndex,
      turnEndIndex: endIndex
    };
  }

  /**
   * 環境情報を抽出
   */
  private extractEnvironmentInfo(entries: HistoryEntry[]): EnvironmentState {
    // 最初のエントリから環境情報を取得
    if (entries.length > 0) {
      const [inputMessage] = entries[0];
      return inputMessage.env_context.env_state;
    }
    
    return {
      operating_system: 'unknown',
      current_working_directory: 'unknown',
      environment_variables: []
    };
  }

  /**
   * 使用されたツールを抽出
   */
  private extractToolsUsed(entries: HistoryEntry[]): ToolUse[] {
    const tools: ToolUse[] = [];
    
    for (const entry of entries) {
      const [, responseMessage] = entry;
      if (isToolUseResponse(responseMessage)) {
        tools.push(...responseMessage.ToolUse.tool_uses);
      }
    }
    
    return tools;
  }

  /**
   * メッセージIDを抽出
   */
  private extractMessageIds(entries: HistoryEntry[]): string[] {
    const messageIds: string[] = [];
    
    for (const entry of entries) {
      const [, responseMessage] = entry;
      if (isToolUseResponse(responseMessage)) {
        messageIds.push(responseMessage.ToolUse.message_id);
      } else if (isResponse(responseMessage)) {
        messageIds.push(responseMessage.Response.message_id);
      }
    }
    
    return messageIds;
  }

  /**
   * historyデータが有効かチェック
   * 直接配列形式とネストされたオブジェクト形式の両方をサポート
   */
  isValidHistoryData(data: unknown): data is HistoryData {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // 直接配列形式の場合（Amazon Q CLIの実際の形式）
    if (Array.isArray(data)) {
      // 直接配列をHistoryData形式に正規化
      const normalizedData = { history: data };
      return this.validateHistoryEntries(normalizedData.history);
    }
    
    // ネストされたオブジェクト形式の場合（期待していた形式）
    const historyData = data as HistoryData;
    if (!Array.isArray(historyData.history)) {
      return false;
    }
    
    return this.validateHistoryEntries(historyData.history);
  }

  /**
   * HistoryEntry配列の検証
   */
  private validateHistoryEntries(entries: unknown[]): boolean {
    // 各エントリが[入力, 応答]の形式かチェック
    for (const entry of entries) {
      if (!Array.isArray(entry) || entry.length !== 2) {
        return false;
      }
      
      const [inputMessage, responseMessage] = entry;
      
      // 入力メッセージの基本構造チェック
      if (!inputMessage || typeof inputMessage !== 'object' || !inputMessage.content) {
        return false;
      }
      
      // 応答メッセージの基本構造チェック
      if (!responseMessage || typeof responseMessage !== 'object') {
        return false;
      }
      
      // 応答メッセージにToolUseまたはResponseが含まれているかチェック
      if (!isToolUseResponse(responseMessage) && !isResponse(responseMessage)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 配列形式のhistoryデータをHistoryData形式に正規化
   */
  normalizeHistoryData(data: unknown): HistoryData {
    if (Array.isArray(data)) {
      return { history: data };
    }
    
    if (data && typeof data === 'object' && 'history' in data) {
      return data as HistoryData;
    }
    
    throw new Error('Invalid history data format');
  }

  /**
   * Promptエントリの数をカウント（実際のユーザーメッセージ数）
   */
  countPromptEntries(historyData: HistoryData): number {
    let promptCount = 0;
    
    for (const entry of historyData.history) {
      const [inputMessage] = entry;
      if (inputMessage?.content && 'Prompt' in inputMessage.content) {
        promptCount++;
      }
    }
    
    return promptCount;
  }

  /**
   * 変換の統計情報を取得
   */
  getTransformationStats(historyData: HistoryData): {
    totalEntries: number;
    totalTurns: number;
    averageToolUsesPerTurn: number;
    totalToolUses: number;
  } {
    const totalEntries = historyData.history.length;
    const turns = this.groupConversationTurns(historyData);
    const totalTurns = turns.length;
    
    let totalToolUses = 0;
    for (const turn of turns) {
      totalToolUses += turn.metadata.toolsUsed.length;
    }
    
    const averageToolUsesPerTurn = totalTurns > 0 ? totalToolUses / totalTurns : 0;
    
    return {
      totalEntries,
      totalTurns,
      averageToolUsesPerTurn,
      totalToolUses
    };
  }
}