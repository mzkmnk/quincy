import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent, Toast, ConfirmDialog],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected title = 'Quincy';
}
