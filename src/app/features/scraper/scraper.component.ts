import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScraperService } from '../../core/services/scraper.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';
import {
  DownloadIconComponent, UploadIconComponent, RefreshIconComponent,
  SendIconComponent, ScraperIconComponent, CheckIconComponent, AlertIconComponent
} from '../../shared/components/icon/icon';

@Component({
  selector: 'app-scraper',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    DownloadIconComponent, UploadIconComponent, RefreshIconComponent,
    SendIconComponent, ScraperIconComponent, CheckIconComponent, AlertIconComponent
  ],
  templateUrl: './scraper.component.html',
  styleUrls: ['./scraper.component.scss']
})
export class ScraperComponent implements OnInit, OnDestroy {
  private scraperApi = inject(ScraperService);
  public toast = inject(ToastService);

  @ViewChild('fileRef') fileRef!: ElementRef<HTMLInputElement>;

  urls = signal('');
  concurrency = signal(3);
  sessionId = signal<string | null>(null);
  session = signal<any>(null);
  remainingSeconds = signal<number | null>(null);
  activeScraping = signal<string[]>([]);
  pickerTarget = signal<any>(null);
  detailTarget = signal<any>(null);

  eventSource: EventSource | null = null;
  pollingInterval: any;

  concurrencyOptions = [1, 2, 3, 4, 6, 8];
  
  predefinedUrls = [
    'https://www.tcs.com', 'https://www.infosys.com', 'https://www.wipro.com',
    'https://www.hcltech.com', 'https://www.techmahindra.com', 'https://www.mphasis.com',
    'https://www.persistent.com', 'https://www.zensar.com', 'https://www.hexaware.com',
    'https://www.cyient.com', 'https://www.nihilentsolutions.com', 'https://www.mastech.com',
  ];

  isRunning = computed(() => this.session()?.status === 'running');
  isPaused = computed(() => this.session()?.status === 'paused');
  isDone = computed(() => {
    const s = this.session()?.status;
    return s === 'complete' || s === 'stopped';
  });
  
  pct = computed(() => {
    const s = this.session();
    return s && s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
  });

  ngOnInit() {
    this.scraperApi.getSessions().subscribe({
      next: (r: any) => {
        const active = r.find((s: any) => s.status === 'running' || s.status === 'paused');
        if (active) {
          this.sessionId.set(String(active.sessionId));
          this.scraperApi.getSession(String(active.sessionId)).subscribe({
            next: (s) => this.session.set(s)
          });
          this.toast.success('Reconnected to active scraping session');
        }
      },
      error: () => {}
    });

    this.setupSSE();
  }

  ngOnDestroy() {
    if (this.eventSource) this.eventSource.close();
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  setupSSE() {
    this.eventSource = new EventSource(`${environment.apiUrl}/scraper/stream`);
    this.eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'progress') {
          this.activeScraping.update(prev => [...prev.filter(u => u !== data.url), data.url]);
          this.session.update(prev => prev ? { ...prev, status: 'running' } : prev);
        } else if (data.type === 'result') {
          this.activeScraping.update(prev => prev.filter(u => u !== data.url));
          this.remainingSeconds.set(data.remainingSeconds ?? null);
          this.session.update(prev => {
            if (!prev) return prev;
            const existing = prev.results?.find((r: any) => r.url === data.url);
            const newResult = { url: data.url, companyName: data.companyName, emails: data.emails || [], phones: data.phones || [], status: data.status, error: data.error };
            const results = existing
              ? prev.results.map((r: any) => r.url === data.url ? newResult : r)
              : [...(prev.results || []), newResult];
            return { ...prev, done: data.done, total: data.total, results };
          });
        } else if (data.type === 'done') {
          this.activeScraping.set([]);
          this.remainingSeconds.set(0);
          this.session.update(prev => prev ? { ...prev, status: data.status || 'complete', done: data.done } : prev);
          if (data.status !== 'stopped') {
            this.toast.success(`✅ Done! Found emails for ${data.results?.filter((r: any) => r.emails?.length > 0).length || 0} companies.`);
          }
        } else if (data.type === 'paused') {
          this.session.update(prev => prev ? { ...prev, status: 'paused' } : prev);
          this.toast.success('⏸ Scraping paused');
        } else if (data.type === 'resumed') {
          this.session.update(prev => prev ? { ...prev, status: 'running' } : prev);
          this.toast.success('▶️ Scraping resumed');
        } else if (data.type === 'stopped') {
          this.activeScraping.set([]);
          this.session.update(prev => prev ? { ...prev, status: 'stopped' } : prev);
          this.toast.success('🛑 Scraping stopped');
        }
      } catch (err) {}
    };
  }

  handleStart() {
    const urlList = this.urls().split('\n').map(u => u.trim()).filter(Boolean);
    if (!urlList.length) return this.toast.error('Enter at least one website URL');
    
    this.session.set({ status: 'running', total: urlList.length, done: 0, results: [], startTime: Date.now() });
    this.activeScraping.set([]);
    this.remainingSeconds.set(null);
    
    this.scraperApi.run(urlList, this.concurrency()).subscribe({
      next: (res: any) => {
        this.sessionId.set(String(res.sessionId));
        this.toast.success(`🚀 Scraping ${urlList.length} sites with ${this.concurrency()} workers`);
      },
      error: () => {
        this.session.set(null);
      }
    });
  }

  handleStop() {
    if (this.sessionId()) this.scraperApi.stop(this.sessionId()!).subscribe({ error: () => {} });
  }

  handlePause() {
    if (this.sessionId()) this.scraperApi.pause(this.sessionId()!).subscribe({ error: () => {} });
  }

  handleResume() {
    if (this.sessionId()) this.scraperApi.resume(this.sessionId()!).subscribe({ error: () => {} });
  }

  handleNewScrape() {
    this.session.set(null);
    this.sessionId.set(null);
    this.activeScraping.set([]);
    this.remainingSeconds.set(null);
    this.urls.set('');
  }

  handleFileImport(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    this.scraperApi.importUrls(file).subscribe({
      next: (res: any) => {
        this.urls.set(res.urls.join('\n'));
        this.toast.success(`📂 ${res.count} URLs loaded`);
      },
      error: () => {}
    });
    e.target.value = '';
  }

  handlePickEmail(url: string, newBest: string) {
    this.session.update(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        results: prev.results.map((r: any) => r.url === url ? { ...r, selectedBestEmail: newBest } : r)
      };
    });
  }

  updateBestEmail(emailObj: any) {
    const target = this.pickerTarget();
    if (!target) return;
    this.scraperApi.updateBestEmail(this.sessionId()!, target.url, emailObj.email).subscribe({
      next: () => {
        this.handlePickEmail(target.url, emailObj.email);
        this.pickerTarget.set(null);
        this.toast.success(`Best email updated to ${emailObj.email}`);
      },
      error: () => {}
    });
  }

  formatTime(seconds: number | null): string {
    if (!seconds || seconds <= 0) return '—';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  getDomain(url: string) {
    return url.replace('https://', '').replace('http://', '').split('/')[0];
  }

  getBestEmail(r: any) {
    return r.selectedBestEmail || r.emails?.[0]?.email;
  }

  getEmailCount(r: any) {
    return r.emails?.length || 0;
  }

  openResultDetail(r: any) {
    this.detailTarget.set(r);
  }

  closeResultDetail() {
    this.detailTarget.set(null);
  }

  resultStatusLabel(r: any): string {
    if (!r) return 'Unknown';
    if (r.status === 'done') return 'Success';
    if (r.status === 'error') return 'Failed';
    if (r.status === 'cancelled') return 'Cancelled';
    return (r.status || 'Unknown').replace(/_/g, ' ');
  }

  resultErrorReason(r: any): string {
    if (!r?.error) return '—';
    // Never show raw JS stack-like messages in the UI
    const msg = String(r.error);
    if (/cannot read|undefined|null|typeerror|referenceerror|is not a function/i.test(msg)) {
      return 'Parsing failed';
    }
    return msg;
  }

  exportExcel() {
    if (this.sessionId()) this.scraperApi.exportExcel(this.sessionId()!);
  }
}
