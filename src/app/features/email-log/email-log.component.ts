import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailService } from '../../core/services/email.service';
import { EmailLog, EmailLogStats } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { SkeletonStatCardComponent, SkeletonTableComponent } from '../../shared/components/skeleton/skeleton';
import {
  DownloadIconComponent,
  RefreshIconComponent,
  TrashIconComponent,
  AlertIconComponent,
  CheckIconComponent,
  ZapIconComponent,
  ClockIconComponent,
  LogsIconComponent,
  RetryIconComponent
} from '../../shared/components/icon/icon';

@Component({
  selector: 'app-email-log',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    SkeletonStatCardComponent, SkeletonTableComponent,
    DownloadIconComponent, RefreshIconComponent, TrashIconComponent,
    AlertIconComponent, CheckIconComponent, ZapIconComponent,
    ClockIconComponent, LogsIconComponent, RetryIconComponent
  ],
  templateUrl: './email-log.component.html',
  styleUrls: ['./email-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailLogComponent implements OnInit {
  private logsApi = inject(EmailService);
  public toast = inject(ToastService);

  logs = signal<EmailLog[]>([]);
  total = signal<number>(0);
  stats = signal<EmailLogStats>({ sent: 0, failed: 0, pending: 0, today: 0 });
  
  // Status filter state
  statusFilter = signal<string>('');
  loading = signal<boolean>(true);

  statCards = computed(() => {
    const s = this.stats();
    return [
      { label: 'Total Sent', value: s.sent || 0, icon: CheckIconComponent, color: 'green' },
      { label: 'Failed', value: s.failed || 0, icon: AlertIconComponent, color: 'red' },
      { label: 'Pending', value: s.pending || 0, icon: ClockIconComponent, color: 'amber' },
      { label: 'Sent Today', value: s.today || 0, icon: ZapIconComponent, color: 'blue' },
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  onFilterChange(status: string) {
    this.statusFilter.set(status);
    this.load();
  }

  load() {
    this.loading.set(true);
    forkJoin([
      this.logsApi.getAll({ status: this.statusFilter(), limit: 200 }),
      this.logsApi.getStats()
    ]).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: ([logsRes, statsRes]) => {
        this.logs.set(logsRes.logs);
        this.total.set(logsRes.total);
        this.stats.set(statsRes);
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleRetry(id: number) {
    this.logsApi.retry(id).subscribe({
      next: () => {
        this.toast.success('Email queued for retry!');
        this.load();
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleDelete(id: number) {
    this.logsApi.delete(id).subscribe({
      next: () => this.load(),
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  exportExcel() {
    this.logsApi.exportExcel();
  }
}
