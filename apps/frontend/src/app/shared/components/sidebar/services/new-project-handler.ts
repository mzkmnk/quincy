import { Router } from '@angular/router';

import { AppStore } from '../../../../core/store/app.state';

/**
 * 新しいプロジェクト作成処理を実行する
 */
export function handleNewProject(router: Router, appStore: AppStore): void {
  // 現在の状態をクリアしてプロジェクト未選択状態にする
  appStore.clearCurrentView();
  // /chatページに移動
  router.navigate(['/chat']);
}
