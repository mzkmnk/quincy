import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionStartComponent, SessionStatus } from './session-start.component';

describe('SessionStartComponent', () => {
  let component: SessionStartComponent;
  let fixture: ComponentFixture<SessionStartComponent>;

  // テストヘルパー関数
  const createSessionStatus = (
    cliLaunched: boolean = false,
    connectionEstablished: boolean = false,
    workspaceReady: boolean = false
  ): SessionStatus => ({
    cliLaunched,
    connectionEstablished,
    workspaceReady
  });

  const setSessionStatus = (status: SessionStatus) => {
    fixture.componentRef.setInput('sessionStatus', status);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionStartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SessionStartComponent);
    component = fixture.componentInstance;
  });

  describe('コンポーネント初期化', () => {
    it('コンポーネントが正常に作成される', () => {
      setSessionStatus(createSessionStatus());
      expect(component).toBeTruthy();
    });

    it('sessionStatusが必須プロパティとして設定される', () => {
      const testStatus = createSessionStatus(true, false, false);
      fixture.componentRef.setInput('sessionStatus', testStatus);
      fixture.detectChanges();
      
      expect(component.sessionStatus()).toEqual(testStatus);
    });
  });

  describe('基本UI要素の表示', () => {
    beforeEach(() => {
      setSessionStatus(createSessionStatus());
    });

    it('ローディングアイコンが表示される', () => {
      const svg = fixture.nativeElement.querySelector('svg.animate-spin');
      expect(svg).toBeTruthy();
      expect(svg.classList.contains('w-24')).toBe(true);
      expect(svg.classList.contains('h-24')).toBe(true);
      expect(svg.classList.contains('animate-spin')).toBe(true);
    });

    it('タイトルが正しく表示される', () => {
      const title = fixture.nativeElement.querySelector('h2');
      expect(title).toBeTruthy();
      expect(title.textContent.trim()).toBe('Starting Amazon Q Session');
    });

    it('説明文が表示される', () => {
      const description = fixture.nativeElement.querySelector('p');
      expect(description.textContent.trim()).toBe('Please wait while we initialize your Amazon Q session...');
    });

    it('タイムアウト説明が表示される', () => {
      const timeout = fixture.nativeElement.querySelector('.text-xs');
      expect(timeout.textContent.trim()).toBe('This may take up to 30 seconds...');
    });
  });

  describe('セッション状態ステップの表示', () => {
    it('全ステップが未完了の状態を表示する', () => {
      setSessionStatus(createSessionStatus(false, false, false));

      const steps = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-center.text-sm');
      expect(steps.length).toBe(3);

      // 全ステップが未完了状態（mutedカラー）
      steps.forEach(step => {
        expect(step.textContent).toContain('🚀') || 
        expect(step.textContent).toContain('🔗') || 
        expect(step.textContent).toContain('📂');
        
        // チェックマークアイコンがないことを確認
        const checkIcon = step.querySelector('svg.w-4.h-4');
        expect(checkIcon).toBeFalsy();
      });
    });

    it('CLI起動完了状態を正しく表示する', () => {
      setSessionStatus(createSessionStatus(true, false, false));

      const cliStep = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-center.text-sm')[0];
      expect(cliStep.textContent).toContain('🚀');
      expect(cliStep.textContent).toContain('Launching Amazon Q CLI');
      
      // チェックマークアイコンが表示される
      const checkIcon = cliStep.querySelector('svg.w-4.h-4');
      expect(checkIcon).toBeTruthy();
    });

    it('接続確立完了状態を正しく表示する', () => {
      setSessionStatus(createSessionStatus(true, true, false));

      const connectionStep = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-center.text-sm')[1];
      expect(connectionStep.textContent).toContain('🔗');
      expect(connectionStep.textContent).toContain('Establishing connection');
      
      const checkIcon = connectionStep.querySelector('svg.w-4.h-4');
      expect(checkIcon).toBeTruthy();
    });

    it('ワークスペース準備完了状態を正しく表示する', () => {
      setSessionStatus(createSessionStatus(true, true, true));

      const workspaceStep = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-center.text-sm')[2];
      expect(workspaceStep.textContent).toContain('📂');
      expect(workspaceStep.textContent).toContain('Setting up project workspace');
      
      const checkIcon = workspaceStep.querySelector('svg.w-4.h-4');
      expect(checkIcon).toBeTruthy();
    });

    it('部分的に完了した状態を正しく表示する', () => {
      setSessionStatus(createSessionStatus(true, false, true));

      const steps = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-center.text-sm');
      
      // CLI起動ステップ（完了）
      const cliIcon = steps[0].querySelector('svg.w-4.h-4');
      expect(cliIcon).toBeTruthy();
      
      // 接続ステップ（未完了）
      const connectionIcon = steps[1].querySelector('svg.w-4.h-4');
      expect(connectionIcon).toBeFalsy();
      
      // ワークスペースステップ（完了）
      const workspaceIcon = steps[2].querySelector('svg.w-4.h-4');
      expect(workspaceIcon).toBeTruthy();
    });
  });

  describe('段階的な状態更新', () => {
    it('ステップ1: CLI起動のみ完了', () => {
      setSessionStatus(createSessionStatus(true, false, false));

      const steps = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-center.text-sm');
      
      // 最初のステップのみチェックマーク
      expect(steps[0].querySelector('svg.w-4.h-4')).toBeTruthy();
      expect(steps[1].querySelector('svg.w-4.h-4')).toBeFalsy();
      expect(steps[2].querySelector('svg.w-4.h-4')).toBeFalsy();
    });

    it('ステップ2: CLI起動と接続確立完了', () => {
      setSessionStatus(createSessionStatus(true, true, false));

      const steps = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-center.text-sm');
      
      expect(steps[0].querySelector('svg.w-4.h-4')).toBeTruthy();
      expect(steps[1].querySelector('svg.w-4.h-4')).toBeTruthy();
      expect(steps[2].querySelector('svg.w-4.h-4')).toBeFalsy();
    });

    it('ステップ3: 全ステップ完了', () => {
      setSessionStatus(createSessionStatus(true, true, true));

      const steps = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-center.text-sm');
      
      expect(steps[0].querySelector('svg.w-4.h-4')).toBeTruthy();
      expect(steps[1].querySelector('svg.w-4.h-4')).toBeTruthy();
      expect(steps[2].querySelector('svg.w-4.h-4')).toBeTruthy();
    });
  });

  describe('レイアウトとスタイリング', () => {
    beforeEach(() => {
      setSessionStatus(createSessionStatus());
    });

    it('適切なコンテナクラスが適用される', () => {
      const container = fixture.nativeElement.querySelector('.h-full');
      expect(container).toBeTruthy();
      expect(container.classList.contains('flex')).toBe(true);
      expect(container.classList.contains('items-center')).toBe(true);
      expect(container.classList.contains('justify-center')).toBe(true);
    });

    it('中央揃えのコンテンツエリアが適用される', () => {
      const contentArea = fixture.nativeElement.querySelector('.text-center');
      expect(contentArea).toBeTruthy();
      expect(contentArea.classList.contains('max-w-md')).toBe(true);
    });

    it('ステップリストに適切なスペーシングが適用される', () => {
      const stepsContainer = fixture.nativeElement.querySelector('.space-y-3');
      expect(stepsContainer).toBeTruthy();
    });

    it('タイトルに適切なスタイルが適用される', () => {
      const title = fixture.nativeElement.querySelector('h2');
      expect(title.classList.contains('text-2xl')).toBe(true);
      expect(title.classList.contains('font-semibold')).toBe(true);
      expect(title.classList.contains('mb-4')).toBe(true);
    });
  });

  describe('アクセシビリティ', () => {
    beforeEach(() => {
      setSessionStatus(createSessionStatus());
    });

    it('意味のあるテキストコンテンツを提供する', () => {
      const steps = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-center.text-sm');
      
      expect(steps[0].textContent).toContain('Launching Amazon Q CLI');
      expect(steps[1].textContent).toContain('Establishing connection');
      expect(steps[2].textContent).toContain('Setting up project workspace');
    });

    it('進行状況を視覚的に示す要素がある', () => {
      // スピナーアニメーション
      const spinner = fixture.nativeElement.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
      
      // 絵文字による視覚的区別
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('🚀');
      expect(text).toContain('🔗');
      expect(text).toContain('📂');
    });

    it('完了状態を明確に示す', () => {
      setSessionStatus(createSessionStatus(true, true, true));
      
      const checkIcons = fixture.nativeElement.querySelectorAll('svg.w-4.h-4');
      expect(checkIcons.length).toBe(3);
    });
  });

  describe('エッジケース', () => {
    it('逆順での完了状態を処理する（ワークスペースが先に完了）', () => {
      setSessionStatus(createSessionStatus(false, false, true));

      const steps = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-center.text-sm');
      
      expect(steps[0].querySelector('svg.w-4.h-4')).toBeFalsy();
      expect(steps[1].querySelector('svg.w-4.h-4')).toBeFalsy();
      expect(steps[2].querySelector('svg.w-4.h-4')).toBeTruthy();
    });

    it('飛び飛びの完了状態を処理する', () => {
      setSessionStatus(createSessionStatus(true, false, true));

      const steps = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-center.text-sm');
      
      expect(steps[0].querySelector('svg.w-4.h-4')).toBeTruthy();
      expect(steps[1].querySelector('svg.w-4.h-4')).toBeFalsy();
      expect(steps[2].querySelector('svg.w-4.h-4')).toBeTruthy();
    });

    it('状態の動的変更を正しく処理する', () => {
      // 最初は全て未完了
      setSessionStatus(createSessionStatus(false, false, false));
      let checkIcons = fixture.nativeElement.querySelectorAll('svg.w-4.h-4');
      expect(checkIcons.length).toBe(0);

      // CLI起動完了
      setSessionStatus(createSessionStatus(true, false, false));
      checkIcons = fixture.nativeElement.querySelectorAll('svg.w-4.h-4');
      expect(checkIcons.length).toBe(1);

      // 接続確立も完了
      setSessionStatus(createSessionStatus(true, true, false));
      checkIcons = fixture.nativeElement.querySelectorAll('svg.w-4.h-4');
      expect(checkIcons.length).toBe(2);

      // 全て完了
      setSessionStatus(createSessionStatus(true, true, true));
      checkIcons = fixture.nativeElement.querySelectorAll('svg.w-4.h-4');
      expect(checkIcons.length).toBe(3);
    });

    it('状態の逆行（完了から未完了への変更）を処理する', () => {
      // 最初は全て完了
      setSessionStatus(createSessionStatus(true, true, true));
      let checkIcons = fixture.nativeElement.querySelectorAll('svg.w-4.h-4');
      expect(checkIcons.length).toBe(3);

      // 一部未完了に戻る
      setSessionStatus(createSessionStatus(true, false, false));
      checkIcons = fixture.nativeElement.querySelectorAll('svg.w-4.h-4');
      expect(checkIcons.length).toBe(1);
    });

    it('レンダリング中にエラーが発生しない', () => {
      expect(() => {
        setSessionStatus(createSessionStatus());
      }).not.toThrow();

      expect(() => {
        setSessionStatus(createSessionStatus(true, true, true));
      }).not.toThrow();
    });
  });
});