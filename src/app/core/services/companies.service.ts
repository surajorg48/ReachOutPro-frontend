import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Company, CompaniesResponse, CompanyStats, Contact } from '../models';

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private api = inject(ApiService);

  getAll(params: { search?: string; status?: string; limit?: number }): Observable<CompaniesResponse> {
    return this.api.get<CompaniesResponse>('/companies', params);
  }

  getOne(id: number): Observable<Company> {
    return this.api.get<Company>(`/companies/${id}`);
  }

  create(data: Partial<Company & { email?: string; hr_name?: string }>): Observable<Company> {
    return this.api.post<Company>('/companies', data);
  }

  update(id: number, data: Partial<Company>): Observable<Company> {
    return this.api.put<Company>(`/companies/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`/companies/${id}`);
  }

  bulkDelete(ids: number[]): Observable<any> {
    return this.api.post('/companies/bulk-delete', { ids });
  }

  bulkStatus(ids: number[], status: string): Observable<any> {
    return this.api.post('/companies/bulk-status', { ids, status });
  }

  bulkAdd(companies: Partial<Company>[]): Observable<any> {
    return this.api.post('/companies/bulk-add', { companies });
  }

  addContact(id: number, data: Partial<Contact>): Observable<Contact> {
    return this.api.post<Contact>(`/companies/${id}/contacts`, data);
  }

  deleteContact(contactId: number): Observable<any> {
    return this.api.delete(`/companies/contacts/${contactId}`);
  }

  setPrimaryContact(contactId: number): Observable<any> {
    return this.api.put(`/companies/contacts/${contactId}/primary`);
  }

  importExcel(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.api.upload('/companies/import-excel', fd);
  }

  exportExcel(): void {
    this.api.openDownload('/companies/export-excel');
  }

  downloadTemplate(): void {
    this.api.openDownload('/companies/template-excel');
  }

  getStats(): Observable<CompanyStats> {
    return this.api.get<CompanyStats>('/companies/stats/summary');
  }
}
