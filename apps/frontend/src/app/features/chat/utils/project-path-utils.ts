/**
 * プロジェクトパスからプロジェクト名を取得する
 * @param projectPath プロジェクトパス
 * @returns プロジェクト名
 */
export function getProjectName(projectPath: string): string {
  if (!projectPath) return 'Unknown Project';
  const parts = projectPath.split('/');
  return parts[parts.length - 1] || projectPath;
}

/**
 * 会話からプロジェクトパスを取得する
 * @param currentConversation 現在の会話
 * @param amazonQHistory Amazon Q履歴
 * @returns プロジェクトパス
 */
export function getProjectPathFromConversation(
  currentConversation: any,
  amazonQHistory: any[]
): string {
  if (!currentConversation) return '';

  const historyItem = amazonQHistory.find(
    h => h.conversation_id === currentConversation.conversation_id
  );
  return historyItem?.projectPath || '';
}