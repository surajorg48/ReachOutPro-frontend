import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ScraperSession, DiscoverHistory } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ScraperService {
  private api = inject(ApiService);
  private eventSource: EventSource | null = null;

  run(urls: string[], concurrency: number): Observable<any> {
    return this.api.post('/scraper/run', { urls, concurrency });
  }

  stop(sessionId: string): Observable<any> {
    return this.api.post('/scraper/stop', { sessionId });
  }

  pause(sessionId: string): Observable<any> {
    return this.api.post('/scraper/pause', { sessionId });
  }

  resume(sessionId: string): Observable<any> {
    return this.api.post('/scraper/resume', { sessionId });
  }

  importUrls(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.api.upload('/scraper/import', fd);
  }

  getSession(id: string): Observable<ScraperSession> {
    return this.api.get<ScraperSession>(`/scraper/session/${id}`);
  }

  getSessions(): Observable<ScraperSession[]> {
    return this.api.get<ScraperSession[]>('/scraper/sessions');
  }

  updateBestEmail(sessionId: string, url: string, bestEmail: string): Observable<any> {
    return this.api.patch('/scraper/result', { sessionId, url, bestEmail });
  }

  exportExcel(sessionId: string): void {
    this.api.openDownload(`/scraper/export/${sessionId}`);
  }

  getCountries(): Observable<string[]> {
    return this.api.get<string[]>('/scraper/locations/countries');
  }

  getStates(country: string): Observable<string[]> {
    return this.api.get<string[]>('/scraper/locations/states', { country });
  }

  getCities(country: string, state: string): Observable<string[]> {
    return this.api.get<string[]>('/scraper/locations/cities', { country, state });
  }

  discover(keywords: string[], location: string, maxResults: number): Observable<any> {
    return this.api.post('/scraper/discover', { keywords, location, maxResults });
  }

  getDiscoverSession(id: string): Observable<any> {
    return this.api.get(`/scraper/discover/${id}`);
  }

  stopDiscover(id: string): Observable<any> {
    return this.api.post(`/scraper/discover/${id}/stop`);
  }

  scrapeDiscovered(discoverId: string, concurrency: number): Observable<any> {
    return this.api.post(`/scraper/discover/${discoverId}/scrape`, { concurrency });
  }

  getDiscoverHistory(): Observable<DiscoverHistory[]> {
    return this.api.get<DiscoverHistory[]>('/scraper/discover-history');
  }

  deleteDiscoverHistory(id: number): Observable<any> {
    return this.api.delete(`/scraper/discover-history/${id}`);
  }

  clearDiscoverHistory(): Observable<any> {
    return this.api.delete('/scraper/discover-history');
  }

  connectSSE(onMessage: (data: any) => void): EventSource {
    this.disconnectSSE();
    const es = new EventSource(`${environment.apiUrl}/scraper/stream`);
    es.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data));
      } catch {}
    };
    this.eventSource = es;
    return es;
  }

  disconnectSSE(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
