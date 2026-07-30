import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Campaign } from '../models';

@Injectable({ providedIn: 'root' })
export class CampaignsService {
  private api = inject(ApiService);

  getAll(): Observable<Campaign[]> {
    return this.api.get<Campaign[]>('/campaigns');
  }

  getOne(id: number): Observable<Campaign> {
    return this.api.get<Campaign>(`/campaigns/${id}`);
  }

  create(data: Partial<Campaign>): Observable<Campaign> {
    return this.api.post<Campaign>('/campaigns', data);
  }

  update(id: number, data: Partial<Campaign>): Observable<Campaign> {
    return this.api.put<Campaign>(`/campaigns/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`/campaigns/${id}`);
  }

  sendTest(id: number, testEmail: string): Observable<any> {
    return this.api.post(`/campaigns/${id}/send-test`, { test_email: testEmail });
  }

  sendSelected(id: number, companyIds: number[]): Observable<any> {
    return this.api.post(`/campaigns/${id}/send-selected`, { company_ids: companyIds });
  }

  sendAll(id: number): Observable<any> {
    return this.api.post(`/campaigns/${id}/send-all`);
  }
}
