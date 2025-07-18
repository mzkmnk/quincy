import type { QProcessSession } from './types';
import { killProcess } from '../process-manager/kill-process';

export async function abortSession(
  sessions: Map<string, QProcessSession>,
  sessionId: string,
  reason: string = 'user_request',
  emitCallback: (event: string, data: any) => void
): Promise<boolean> {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  try {
    session.status = 'aborted';
    
    // プロセスを強制終了
    killProcess(session.process);

    // Thinking状態をリセット
    session.isThinkingActive = false;
    
    // 終了イベントを発行
    emitCallback('session:aborted', {
      sessionId,
      reason,
      exitCode: 0 // 正常な中止として扱う
    });

    // セッションを遅延削除（プロセス完全終了を待つ）
    setTimeout(() => {
      sessions.delete(sessionId);
    }, 3000);

    return true;
  } catch (error) {
    return false;
  }
}