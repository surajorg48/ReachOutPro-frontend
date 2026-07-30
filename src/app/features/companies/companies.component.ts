import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompaniesService } from '../../core/services/companies.service';
import { CampaignsService } from '../../core/services/campaigns.service';
import { Company, Campaign } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { finalize } from 'rxjs/operators';
import { SkeletonTableComponent } from '../../shared/components/skeleton/skeleton';
import {
  SendIconComponent, TrashIconComponent, DownloadIconComponent,
  UploadIconComponent, ExportIconComponent, PlusIconComponent,
  XIconComponent, CompaniesIconComponent
} from '../../shared/components/icon/icon';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    CommonModule, FormsModule, SkeletonTableComponent,
    SendIconComponent, TrashIconComponent, DownloadIconComponent,
    UploadIconComponent, ExportIconComponent, PlusIconComponent,
    XIconComponent, CompaniesIconComponent
  ],
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.scss']
})
export class CompaniesComponent implements OnInit {
  private companiesApi = inject(CompaniesService);
  private campaignsApi = inject(CampaignsService);
  public toast = inject(ToastService);

  @ViewChild('fileRef') fileRef!: ElementRef<HTMLInputElement>;

  companies = signal<Company[]>([]);
  total = signal<number>(0);
  loading = signal<boolean>(true);

  search = signal<string>('');
  statusFilter = signal<string>('');
  sortBy = signal<string>('newest'); // newest, oldest, city

  selected = signal<Set<number>>(new Set());
  showAddModal = signal<boolean>(false);
  addForm = signal({ name: '', website: '', email: '', hr_name: '', city: '', industry: 'IT' });

  sending = signal<boolean>(false);
  campaigns = signal<Campaign[]>([]);
  showSendModal = signal<boolean>(false);
  selectedCampaign = signal<number | string>('');
  sendMode = signal<'selected' | 'all'>('selected');
  importProgress = signal<string | null>(null);

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: '⏳ Pending' },
    { value: 'contacted', label: '✅ Contacted' },
    { value: 'not_interested', label: '🚫 Not Interested' },
  ];

  sortedCompanies = computed(() => {
    const list = [...this.companies()];
    const sort = this.sortBy();
    return list.sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === 'city') return (a.city || '').localeCompare(b.city || '');
      return 0;
    });
  });

  parseContacts(jsonStr?: string): any[] {
    if (!jsonStr) return [];
    try { return JSON.parse(jsonStr); } catch { return []; }
  }

  ngOnInit() {
    this.load();
    this.campaignsApi.getAll().subscribe({
      next: (res) => this.campaigns.set(res),
      error: () => {}
    });
  }

  load() {
    this.loading.set(true);
    this.companiesApi.getAll({ search: this.search(), status: this.statusFilter(), limit: 200 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.companies.set(res.companies);
          this.total.set(res.total);
        },
        error: (e: Error) => this.toast.error(e.message)
      });
  }

  onFilterChange() {
    this.load();
  }

  toggleSelect(id: number) {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
  }

  toggleAll() {
    const current = this.selected();
    if (current.size === this.companies().length && this.companies().length > 0) {
      this.selected.set(new Set());
    } else {
      this.selected.set(new Set(this.companies().map(c => c.id)));
    }
  }

  handleDelete(id: number) {
    if (!confirm('Delete this company?')) return;
    this.companiesApi.delete(id).subscribe({
      next: () => {
        const s = new Set(this.selected());
        if (s.has(id)) { s.delete(id); this.selected.set(s); }
        this.load();
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleBulkDelete() {
    if (!confirm(`Delete ${this.selected().size} companies?`)) return;
    this.companiesApi.bulkDelete([...this.selected()]).subscribe({
      next: () => {
        this.selected.set(new Set());
        this.load();
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleAdd() {
    const form = this.addForm();
    if (!form.name) return this.toast.error('Company name is required');
    this.companiesApi.create(form).subscribe({
      next: () => {
        this.toast.success('Company added!');
        this.showAddModal.set(false);
        this.addForm.set({ name: '', website: '', email: '', hr_name: '', city: '', industry: 'IT' });
        this.load();
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  triggerFileInput() {
    if (this.fileRef) this.fileRef.nativeElement.click();
  }

  handleImportExcel(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importProgress.set('Importing...');
    this.companiesApi.importExcel(file).subscribe({
      next: (res) => {
        this.toast.success(`✅ ${res.added} companies imported!`);
        this.load();
        this.importProgress.set(null);
        input.value = '';
      },
      error: (e: Error) => {
        this.toast.error(e.message);
        this.importProgress.set(null);
        input.value = '';
      }
    });
  }

  downloadTemplate() {
    this.companiesApi.downloadTemplate();
  }

  exportExcel() {
    this.companiesApi.exportExcel();
  }

  openSendDialog(mode: 'selected' | 'all') {
    if (mode === 'selected' && this.selected().size === 0) return this.toast.error('Select at least one company');
    if (this.campaigns().length === 0) return this.toast.error('Create a campaign first!');
    
    this.sendMode.set(mode);
    this.selectedCampaign.set(this.campaigns()[0]?.id || '');
    this.showSendModal.set(true);
  }

  handleSend() {
    const campId = Number(this.selectedCampaign());
    if (!campId) return this.toast.error('Select a campaign');
    
    this.sending.set(true);
    this.showSendModal.set(false);
    
    const mode = this.sendMode();
    const req = mode === 'selected' 
      ? this.campaignsApi.sendSelected(campId, [...this.selected()])
      : this.campaignsApi.sendAll(campId);

    req.pipe(finalize(() => this.sending.set(false))).subscribe({
      next: (res: any) => {
        if (mode === 'selected') {
          this.toast.success(`📤 Queued ${res.count} emails! Sending in background...`);
        } else {
          this.toast.success(`📤 Queued ${res.count} emails to all pending companies!`);
        }
        this.selected.set(new Set());
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleSetPrimary(contactIdStr: string) {
    const contactId = Number(contactIdStr);
    if (!contactId) return;
    this.companiesApi.setPrimaryContact(contactId).subscribe({
      next: () => {
        this.toast.success('Primary email updated');
        this.load();
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  clearSelection() {
    this.selected.set(new Set());
  }

  selectSingle(id: number) {
    this.selected.set(new Set([id]));
  }

  markNotInterested() {
    this.companiesApi.bulkStatus([...this.selected()], 'not_interested').subscribe({
      next: () => {
        this.toast.success('Marked as Not Interested');
        this.load();
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }
}
