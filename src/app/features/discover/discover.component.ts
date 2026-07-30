import { Component, OnInit, OnDestroy, Output, EventEmitter, inject, signal, computed, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScraperService } from '../../core/services/scraper.service';
import { CompaniesService } from '../../core/services/companies.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';
import {
  SearchIconComponent, MapPinIconComponent, GlobeIconComponent, TagIconComponent,
  CityIconComponent, TrashIconComponent, CheckIconComponent, DownloadIconComponent,
  SendIconComponent, SaveIconComponent, XIconComponent, ListIconComponent, RefreshIconComponent
} from '../../shared/components/icon/icon';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-discover-scraper',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    SearchIconComponent, MapPinIconComponent, GlobeIconComponent, TagIconComponent,
    CityIconComponent, TrashIconComponent, CheckIconComponent, DownloadIconComponent,
    SendIconComponent, SaveIconComponent, XIconComponent, ListIconComponent, RefreshIconComponent
  ],
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss']
})
export class DiscoverComponent implements OnInit, OnDestroy {
  @Output() scrapeUrls = new EventEmitter<string[]>();

  private scraperApi = inject(ScraperService);
  private companiesApi = inject(CompaniesService);
  private zone = inject(NgZone);
  public toast = inject(ToastService);

  discoverTab = signal<'search' | 'history'>('search');
  history = signal<any[]>([]);
  loadingHistory = signal(false);

  locationText = signal('');
  country = signal('');
  stateName = signal('');
  cityName = signal('');

  countries = signal<string[]>([]);
  statesList = signal<string[]>([]);
  citiesList = signal<string[]>([]);

  loadingStates = signal(false);
  loadingCities = signal(false);
  showDropdowns = signal(false);

  keywords = signal<string[]>([]);
  kwInput = signal('');
  maxResults = signal(30);

  discoverId = signal<string | null>(null);
  status = signal<string | null>(null);
  results = signal<any[]>([]);
  progressMsg = signal('');
  searching = signal(false);
  selected = signal<Set<number>>(new Set());

  private eventSource: EventSource | null = null;

  kwSuggestions = [
    'IT companies', 'Software companies', 'Tech startups', 'Web development companies',
    'AI companies', 'SaaS companies', 'Digital marketing agencies', 'Cloud companies',
    'Mobile app development', 'Cybersecurity companies', 'Data analytics companies',
    'ERP companies', 'Fintech companies', 'Consulting firms', 'BPO companies',
  ];

  filteredSuggestions = computed(() =>
    this.kwSuggestions.filter(s => !this.keywords().includes(s)).slice(0, 12)
  );

  /** Enables Discover button only when keyword tags exist and search is idle */
  canDiscover = computed(() => this.keywords().length > 0 && !this.searching());

  ngOnInit() {
    this.scraperApi.getCountries().subscribe({ next: (r: any) => this.countries.set(r || []), error: () => {} });
    this.loadHistory();
    this.setupSSE();
  }

  ngOnDestroy() {
    if (this.eventSource) this.eventSource.close();
  }

  setupSSE() {
    this.eventSource = new EventSource(`${environment.apiUrl}/scraper/stream`);
    this.eventSource.onmessage = (e) => {
      // EventSource runs outside Angular zone — wrap so UI (incl. button) updates
      this.zone.run(() => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'discover_progress') {
            this.progressMsg.set(data.message || '');
            if (data.step === 'found' && data.latest) {
              const current = this.results();
              const key = data.latest.domain || data.latest.name;
              if (!current.some(r => (r.domain || r.name) === key)) {
                const next = [...current, data.latest];
                this.results.set(next);
                this.selected.set(new Set(next.map((_, i) => i)));
              }
            }
          } else if (data.type === 'discover_done') {
            this.searching.set(false);
            this.status.set(data.status || 'complete');
            if (data.results?.length) {
              this.results.set(data.results);
              this.selected.set(new Set(data.results.map((_: any, i: number) => i)));
            }
            this.progressMsg.set('');
            this.toast.success(`Found ${data.count} companies!`);
          } else if (data.type === 'discover_stopped') {
            this.searching.set(false);
            this.status.set('stopped');
            this.progressMsg.set('');
            this.toast.success('Discovery stopped');
          } else if (data.type === 'discover_error') {
            this.searching.set(false);
            this.status.set('error');
            this.progressMsg.set('');
            this.toast.error(`Error: ${data.error}`);
          }
        } catch {
          /* ignore malformed SSE payloads */
        }
      });
    };
  }

  loadHistory() {
    this.loadingHistory.set(true);
    this.scraperApi.getDiscoverHistory().pipe(finalize(() => this.loadingHistory.set(false))).subscribe({
      next: (r: any) => this.history.set(r || []),
      error: () => {}
    });
  }

  onCountryChange(c: string) {
    this.country.set(c);
    this.stateName.set('');
    this.cityName.set('');
    this.statesList.set([]);
    this.citiesList.set([]);
    this.updateLocationText();

    if (!c) return;
    this.loadingStates.set(true);
    this.scraperApi.getStates(c).pipe(finalize(() => this.loadingStates.set(false))).subscribe({
      next: (r: any) => this.statesList.set(r || []),
      error: () => {}
    });
  }

  onStateChange(s: string) {
    this.stateName.set(s);
    this.cityName.set('');
    this.citiesList.set([]);
    this.updateLocationText();

    if (!this.country() || !s) return;
    this.loadingCities.set(true);
    this.scraperApi.getCities(this.country(), s).pipe(finalize(() => this.loadingCities.set(false))).subscribe({
      next: (r: any) => this.citiesList.set(r || []),
      error: () => {}
    });
  }

  onCityChange(c: string) {
    this.cityName.set(c);
    this.updateLocationText();
  }

  updateLocationText() {
    const parts = [this.cityName(), this.stateName(), this.country()].filter(Boolean);
    if (parts.length) this.locationText.set(parts.join(', '));
  }

  addKw(kw: string) {
    const c = (kw || '').trim();
    if (!c) return;
    if (!this.keywords().includes(c)) {
      this.keywords.update(p => [...p, c]);
    }
    this.kwInput.set('');
  }

  removeKw(i: number) {
    this.keywords.update(p => p.filter((_, idx) => idx !== i));
  }

  handleKwKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      // Read DOM value so we don't rely on signal lag vs keydown timing
      const raw = (e.target as HTMLInputElement)?.value ?? this.kwInput();
      this.addKw(raw);
      return;
    }
    if (e.key === 'Backspace' && !this.kwInput() && this.keywords().length) {
      this.removeKw(this.keywords().length - 1);
    }
  }

  handleDiscover() {
    if (!this.canDiscover()) {
      return this.toast.error('Add at least one keyword');
    }
    this.searching.set(true);
    this.results.set([]);
    this.status.set('searching');
    this.selected.set(new Set());

    this.scraperApi.discover(this.keywords(), this.locationText() || '', this.maxResults()).subscribe({
      next: (res: any) => this.discoverId.set(String(res.discoverId)),
      error: (e: Error) => {
        this.toast.error(e.message);
        this.searching.set(false);
        this.status.set('error');
      }
    });
  }

  handleStop() {
    if (this.discoverId()) this.scraperApi.stopDiscover(this.discoverId()!).subscribe({ error: () => {} });
  }

  toggle(i: number) {
    const n = new Set(this.selected());
    n.has(i) ? n.delete(i) : n.add(i);
    this.selected.set(n);
  }

  toggleAll() {
    if (this.selected().size === this.results().length) {
      this.selected.set(new Set());
    } else {
      this.selected.set(new Set(this.results().map((_, i) => i)));
    }
  }

  handleScrape() {
    const urls = this.results().filter((_, i) => this.selected().has(i)).map(r => r.website).filter(Boolean);
    if (!urls.length) return this.toast.error('No websites in selection');
    this.scrapeUrls.emit(urls);
  }

  handleSaveToDb() {
    const list = this.results().filter((_, i) => this.selected().has(i)).map(r => ({
      name: r.name, website: r.website || '', industry: r.category || 'IT', city: this.cityName() || this.stateName() || ''
    }));
    if (!list.length) return this.toast.error('Select at least one company');
    this.companiesApi.bulkAdd(list).subscribe({
      next: (res: any) => this.toast.success(`${res.added} companies saved!`),
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleLoadHistory(entry: any) {
    this.results.set(entry.results || []);
    this.selected.set(new Set((entry.results || []).map((_: any, i: number) => i)));
    this.status.set('complete');
    this.discoverTab.set('search');
    this.toast.success(`Loaded ${entry.result_count} results from history`);
  }

  handleDeleteHistory(id: number) {
    this.scraperApi.deleteDiscoverHistory(id).subscribe({
      next: () => { this.loadHistory(); this.toast.success('Deleted'); },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleClearHistory() {
    if (!confirm('Clear all discovery history?')) return;
    this.scraperApi.clearDiscoverHistory().subscribe({
      next: () => { this.loadHistory(); this.toast.success('History cleared'); },
      error: (e: Error) => this.toast.error(e.message)
    });
  }
}
