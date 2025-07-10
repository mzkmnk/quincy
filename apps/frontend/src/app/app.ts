import { Component } from '@angular/core';
import { LayoutComponent } from './shared/components/layout/layout.component';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent],
  templateUrl: './app.html',
})
export class App {
  protected title = 'Quincy';
}
