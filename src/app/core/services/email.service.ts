import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { EmailLog, EmailLogStats, EmailLogsResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private api = inject(ApiService);

  getAll(params: { status?: string; limit?: number }): Observable<EmailLogsResponse> {
    return this.api.get<EmailLogsResponse>('/logs', params);
  }

  getStats(): Observable<EmailLogStats> {
    return this.api.get<EmailLogStats>('/logs/stats');
  }

  retry(id: number): Observable<any> {
    return this.api.post(`/logs/${id}/retry`);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`/logs/${id}`);
  }

  exportExcel(): void {
    this.api.openDownload('/logs/export');
  }
}
