import type { AmazonQConversation, ConversationMetadata } from '@quincy/shared';

/**
 * プロジェクトパスからプロジェクト名を取得する
 * @param projectPath プロジェクトパス
 * @returns プロジェクト名
 */
export function getProjectName(projectPath: string): string {
  if (!projectPath) return 'Unknown Project';
  
  // WindowsとUnix/Linuxの両方のパス区切り文字に対応
  const normalizedPath = projectPath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/').filter(part => part.length > 0);
  
  return parts[parts.length - 1] || projectPath;
}

/**
 * 会話からプロジェクトパスを取得する
 * @param currentConversation 現在の会話
 * @param amazonQHistory Amazon Q履歴
 * @returns プロジェクトパス
 */
export function getProjectPathFromConversation(
  currentConversation: AmazonQConversation | null,
  amazonQHistory: ConversationMetadata[]
): string {
  if (!currentConversation) return '';

  const historyItem = amazonQHistory.find(
    h => h.conversation_id === currentConversation.conversation_id
  );
  return historyItem?.projectPath || '';
}
