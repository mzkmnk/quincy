import { Component, input, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectListComponent } from '../project-list/project-list.component';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, ProjectListComponent, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col">
      <!-- New Project Button -->
      <div class="p-4">
        <p-button
          label="New Project"
          icon="pi pi-plus"
          severity="secondary"
          [outlined]="true"
          styleClass="w-full"
          [class.hidden]="collapsed()"
          (onClick)="createNewProject()"
        />
        <p-button
          icon="pi pi-plus"
          severity="secondary"
          [outlined]="true"
          class="w-full"
          [class.hidden]="!collapsed()"
          (onClick)="createNewProject()"
        />
      </div>

      <!-- Projects List -->
      <app-project-list [collapsed]="collapsed()"></app-project-list>


    </div>
  `
})
export class SidebarComponent {
  collapsed = input<boolean>(false);
  
  // モーダル表示要求を親コンポーネントに通知
  newProjectRequested = output<void>();

  createNewProject(): void {
    // 親コンポーネントにモーダル表示を要求
    this.newProjectRequested.emit();
  }
}