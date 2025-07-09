import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import type { Project, Session } from '@quincy/shared';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'frontend';
  
  // sharedパッケージの型を使用するテスト
  private testProject: Project = {
    id: '1',
    name: 'Test Project'
  };
  
  private testSession: Session = {
    id: 'session-1',
    projectId: this.testProject.id
  };
}
