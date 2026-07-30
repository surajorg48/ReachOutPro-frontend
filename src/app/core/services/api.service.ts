import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private baseUrl = environment.apiUrl;

  get<T>(path: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: any = {}): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  patch<T>(path: string, body: any = {}): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }

  upload<T>(path: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, formData);
  }

  getDownloadUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  /** Authenticated download — sends Bearer token via HttpClient interceptor */
  openDownload(path: string, fallbackFilename = 'download.xlsx'): void {
    this.http
      .get(`${this.baseUrl}${path}`, {
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe({
        next: (res) => {
          const disposition = res.headers.get('Content-Disposition') || '';
          const match = /filename="?([^"]+)"?/i.exec(disposition);
          const filename = match?.[1] || fallbackFilename;
          const blob = res.body;
          if (!blob) return;

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        },
        error: async (err) => {
          let message = err.userMessage || 'Download failed. Please try again.';
          try {
            if (err.error instanceof Blob) {
              const text = await err.error.text();
              const parsed = JSON.parse(text);
              message = parsed.error || parsed.message || message;
            }
          } catch {
            // keep default
          }
          this.toast.error(message);
        },
      });
  }
}
