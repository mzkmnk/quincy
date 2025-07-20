import { WebSocketService } from '../../../../core/services/websocket.service';
import { AppStore } from '../../../../core/store/app.state';

export interface SessionStatus {
  cliLaunched: boolean;
  connectionEstablished: boolean;
  workspaceReady: boolean;
}

/**
 * セッションを再開する
 * @param projectPath プロジェクトパス
 * @param conversationId 会話ID
 * @param websocketService WebSocketサービス
 * @param appStore アプリストア
 * @param sessionStatus セッションステータス
 * @param updateSessionStatus セッションステータス更新関数
 */
export function resumeSession(
  projectPath: string,
  conversationId: string,
  websocketService: WebSocketService,
  appStore: AppStore,
  sessionStatus: SessionStatus,
  updateSessionStatus: (status: SessionStatus) => void
): void {
  if (!projectPath) {
    return;
  }

  // セッション開始状態に切り替え
  appStore.clearCurrentView();
  appStore.setSessionStarting(true);

  // セッションステータスをリセット
  const newSessionStatus: SessionStatus = {
    cliLaunched: false,
    connectionEstablished: false,
    workspaceReady: false,
  };
  updateSessionStatus(newSessionStatus);

  // ステータス更新を模擬（実際のイベントに基づいて更新）
  setTimeout(() => {
    updateSessionStatus({ ...newSessionStatus, cliLaunched: true });
  }, 1000);
  setTimeout(() => {
    updateSessionStatus({ ...newSessionStatus, cliLaunched: true, connectionEstablished: true });
  }, 2000);
  setTimeout(() => {
    updateSessionStatus({
      ...newSessionStatus,
      cliLaunched: true,
      connectionEstablished: true,
      workspaceReady: true,
    });
  }, 3000);

  // タイムアウトを設定（30秒）
  const timeoutId = setTimeout(() => {
    console.error('Session resume timeout after 30 seconds');
    appStore.setSessionStarting(false);
    appStore.setSessionError('Session resume timed out. Please try again.');
  }, 30000);

  // セッション失敗リスナーを設定
  const failedSubscription = websocketService.onSessionFailed().subscribe(data => {
    console.error('Session resume failed:', data.error);
    clearTimeout(timeoutId);
    appStore.setSessionStarting(false);
    appStore.setSessionError(`Failed to resume session: ${data.error}`);
    failedSubscription.unsubscribe();
  });

  // Resume sessionリクエストを送信
  websocketService.resumeSession(projectPath, conversationId);

  // セッション開始リスナーを設定
  websocketService.setupProjectSessionListeners(data => {
    console.log('Amazon Q session resumed:', data);
    clearTimeout(timeoutId);
    failedSubscription.unsubscribe();
    appStore.switchToActiveSession(data);
  });
}
