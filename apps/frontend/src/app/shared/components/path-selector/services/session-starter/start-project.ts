import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { WebSocketService } from '../../../../../core/services/websocket.service';
import { AppStore } from '../../../../../core/store/app.state';

/**
 * プロジェクトセッションを開始する
 * @param path プロジェクトパス
 * @param resumeSession セッション再開フラグ
 * @param websocket WebSocketサービス
 * @param appStore アプリストア
 * @param messageService メッセージサービス
 * @param router ルーター
 * @param startingSignal 開始状態のsignal
 */
export async function startProject(
  path: string,
  resumeSession: boolean,
  websocket: WebSocketService,
  appStore: AppStore,
  messageService: MessageService,
  router: Router,
  startingSignal: { set: (value: boolean) => void }
): Promise<void> {
  const trimmedPath = path.trim();
  startingSignal.set(true);

  try {
    console.log('Starting project session:', trimmedPath);

    // WebSocket接続を確認
    websocket.connect();

    // 現在の表示状態をクリアしてセッション開始状態をセット
    appStore.clearCurrentView();
    appStore.setSessionStarting(true);

    // プロジェクトセッションを開始
    websocket.startProjectSession(trimmedPath, resumeSession);

    // セッション開始の通知を受け取るリスナーを設定
    websocket.setupProjectSessionListeners((data) => {
      console.log('Amazon Q session started:', data);

      // アクティブセッションモードに切り替え
      appStore.switchToActiveSession(data);

      // チャット画面に移動
      router.navigate(['/chat']);
    });

    // エラーハンドリングのリスナーを設定
    websocket.on('error', (error: { code?: string; message?: string;[key: string]: unknown }) => {
      console.error('WebSocket error:', error);

      let userMessage = 'セッションの開始中にエラーが発生しました。';

      if (error.code === 'Q_CLI_NOT_AVAILABLE' || error.code === 'Q_CLI_NOT_FOUND') {
        userMessage = 'Amazon Q CLIが見つかりません。Amazon Q CLIをインストールしてから再度お試しください。';
      } else if (error.code === 'Q_CLI_PERMISSION_ERROR') {
        userMessage = 'Amazon Q CLIの実行権限がありません。ファイルの権限を確認してください。';
      } else if (error.code === 'Q_CLI_SPAWN_ERROR') {
        userMessage = 'Amazon Q CLIプロセスの起動に失敗しました。インストールを確認してください。';
      }

      // エラー状態をストアに保存
      appStore.setSessionError(userMessage);
      startingSignal.set(false);
    });

  } catch (error) {
    console.error('Error starting project session:', error);
    appStore.setSessionError('プロジェクトセッションの開始中にエラーが発生しました。');
    messageService.add({
      severity: 'error',
      summary: 'エラー',
      detail: 'プロジェクトの開始に失敗しました',
      life: 5000
    });
    startingSignal.set(false);
  }
}