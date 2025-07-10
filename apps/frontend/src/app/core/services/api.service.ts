import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Project, Session } from '@quincy/shared';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api';

  // Project endpoints
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/projects`);
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}`);
  }

  createProject(project: Omit<Project, 'id'>): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects`, project);
  }

  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${id}`, project);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`);
  }

  // Session endpoints
  getSessions(projectId?: string): Observable<Session[]> {
    const url = projectId 
      ? `${this.baseUrl}/sessions?projectId=${projectId}`
      : `${this.baseUrl}/sessions`;
    return this.http.get<Session[]>(url);
  }

  getSession(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.baseUrl}/sessions/${id}`);
  }

  createSession(session: Omit<Session, 'id'>): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions`, session);
  }

  updateSession(id: string, session: Partial<Session>): Observable<Session> {
    return this.http.put<Session>(`${this.baseUrl}/sessions/${id}`, session);
  }

  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sessions/${id}`);
  }
}