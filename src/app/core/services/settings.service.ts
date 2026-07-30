import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AppSettings, GmailAccount } from '../models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = inject(ApiService);

  get(): Observable<AppSettings> {
    return this.api.get<AppSettings>('/settings');
  }

  update(data: Partial<AppSettings>): Observable<any> {
    return this.api.put('/settings', data);
  }

  getGmailStatus(): Observable<{ gmailConnected: boolean }> {
    return this.api.get<{ gmailConnected: boolean }>('/settings/gmail/status');
  }

  getAuthUrl(): Observable<{ url: string }> {
    return this.api.get<{ url: string }>('/settings/gmail/auth-url');
  }

  disconnect(): Observable<any> {
    return this.api.post('/settings/gmail/disconnect');
  }

  uploadCredentials(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('credentials', file);
    return this.api.upload('/settings/gmail/credentials', fd);
  }

  getGmailAccounts(): Observable<{ accounts: GmailAccount[]; active_account?: { id: number } }> {
    return this.api.get('/settings/gmail/accounts');
  }

  addGmailAccount(email: string, label: string, credFile: File): Observable<any> {
    const fd = new FormData();
    fd.append('email', email);
    fd.append('label', label || email);
    fd.append('credentials', credFile);
    return this.api.upload('/settings/gmail/accounts', fd);
  }

  activateGmailAccount(id: number): Observable<any> {
    return this.api.post(`/settings/gmail/accounts/${id}/activate`);
  }

  getAccountAuthUrl(id: number): Observable<{ url: string }> {
    return this.api.get<{ url: string }>(`/settings/gmail/accounts/${id}/auth-url`);
  }

  removeGmailAccount(id: number): Observable<any> {
    return this.api.delete(`/settings/gmail/accounts/${id}`);
  }

  disconnectGmailAccount(id: number): Observable<any> {
    return this.api.post(`/settings/gmail/accounts/${id}/disconnect`);
  }

  getTemplate(): Observable<{ content: string }> {
    return this.api.get<{ content: string }>('/settings/template');
  }

  saveTemplate(content: string): Observable<any> {
    return this.api.put('/settings/template', { content });
  }
}
