import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CompaniesService } from '../../core/services/companies.service';
import { EmailService } from '../../core/services/email.service';
import { CompanyStats, EmailLog } from '../../core/models';
import { SkeletonStatCardComponent, SkeletonCardComponent } from '../../shared/components/skeleton/skeleton';
import {
  CompaniesIconComponent,
  MailIconComponent,
  ClockIconComponent,
  CheckIconComponent,
  ZapIconComponent,
  AlertIconComponent,
  ScraperIconComponent,
  CampaignIconComponent,
  LogsIconComponent,
  TrendUpIconComponent,
  ActivityIconComponent,
  ChevronRightIconComponent
} from '../../shared/components/icon/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    BaseChartDirective,
    SkeletonStatCardComponent,
    SkeletonCardComponent,
    TrendUpIconComponent,
    ActivityIconComponent,
    ChevronRightIconComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private companiesApi = inject(CompaniesService);
  private logsApi = inject(EmailService);
  public router = inject(Router);

  loading = signal(true);
  stats = signal<CompanyStats>({ total: 0, pending: 0, contacted: 0, sentToday: 0, totalSent: 0, totalFailed: 0, totalEmails: 0 });
  recentLogs = signal<EmailLog[]>([]);
  activityFilter = signal<'all' | 'sent' | 'failed' | 'pending'>('all');
  activityQuery = signal('');

  todayLabel = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    weekday: 'short',
    month: 'long',
  });

  pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111111',
        titleColor: '#ffffff',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12, weight: 600 },
        bodyColor: '#ffffff',
        borderWidth: 0,
        padding: 12,
        displayColors: false,
        cornerRadius: 12,
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`
        }
      }
    }
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#9CA3AF', font: { size: 11, family: 'Inter' } }
      },
      y: {
        grid: { color: '#F3F4F6', tickLength: 0 },
        border: { display: false },
        ticks: { color: '#9CA3AF', font: { size: 11, family: 'Inter' } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111111',
        titleColor: '#ffffff',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12, weight: 600 },
        bodyColor: '#ffffff',
        borderWidth: 0,
        padding: 12,
        displayColors: false,
        cornerRadius: 12,
      }
    }
  };

  pieChartData = computed<ChartData<'doughnut'>>(() => {
    const s = this.stats();
    const notInterested = Math.max(0, s.total - s.contacted - s.pending);

    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColor: string[] = [];

    if (s.contacted > 0) { labels.push('Contacted'); data.push(s.contacted); backgroundColor.push('#E85D3F'); }
    if (s.pending > 0) { labels.push('Pending'); data.push(s.pending); backgroundColor.push('#111111'); }
    if (notInterested > 0) { labels.push('Other'); data.push(notInterested); backgroundColor.push('#E5E7EB'); }

    return {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderWidth: 0,
        hoverOffset: 6
      }]
    };
  });

  pieLegend = computed(() => {
    const data = this.pieChartData();
    return data.labels?.map((label, index) => ({
      name: label as string,
      value: data.datasets[0].data[index],
      color: (data.datasets[0].backgroundColor as string[])[index]
    })) || [];
  });

  barChartData = computed<ChartData<'bar'>>(() => {
    const s = this.stats();
    return {
      labels: ['Total Sent', 'Failed', 'Pending', 'Today'],
      datasets: [{
        data: [s.totalSent, s.totalFailed, s.pending, s.sentToday],
        backgroundColor: ['#111111', '#E85D3F', '#F4A994', '#E5E7EB'],
        borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 10, bottomRight: 10 } as any,
        borderSkipped: false,
        barPercentage: 0.55
      }]
    };
  });

  statCards = computed(() => {
    const s = this.stats();
    return [
      { label: 'Total Companies', value: s.total, icon: CompaniesIconComponent, color: 'ink', trend: '+12%' },
      { label: 'Emails Found', value: s.totalEmails, icon: MailIconComponent, color: 'coral', trend: '+8%' },
      { label: 'Pending Contact', value: s.pending, icon: ClockIconComponent, color: 'amber', trend: '—' },
      { label: 'Contacted', value: s.contacted, icon: CheckIconComponent, color: 'ink', trend: '+5%' },
      { label: 'Sent Today', value: s.sentToday, icon: ZapIconComponent, color: 'coral', trend: 'today' },
      { label: 'Total Failed', value: s.totalFailed, icon: AlertIconComponent, color: 'muted', trend: '—' }
    ];
  });

  quickActions = [
    { label: 'Manage Companies', sub: 'Organize your pipeline', icon: CompaniesIconComponent, color: '#E85D3F', path: '/companies' },
    { label: 'Scrape Emails', sub: 'Enrich contacts from sites', icon: ScraperIconComponent, color: '#111111', path: '/scraper' },
    { label: 'New Campaign', sub: 'Launch outreach sequence', icon: CampaignIconComponent, color: '#E85D3F', path: '/campaigns/new' },
    { label: 'Email Logs', sub: 'Track delivery activity', icon: LogsIconComponent, color: '#6B7280', path: '/email-log' },
  ];

  successRate = computed(() => {
    const s = this.stats();
    return s.totalSent > 0 ? Math.round(((s.totalSent - s.totalFailed) / s.totalSent) * 100) : 0;
  });

  contactRate = computed(() => {
    const s = this.stats();
    return s.total > 0 ? Math.round((s.contacted / s.total) * 100) : 0;
  });

  filteredLogs = computed(() => {
    const q = this.activityQuery().trim().toLowerCase();
    const filter = this.activityFilter();
    return this.recentLogs().filter((log) => {
      const statusOk = filter === 'all' || log.status === filter;
      if (!statusOk) return false;
      if (!q) return true;
      const hay = `${log.company_name || ''} ${log.recipient_email || ''}`.toLowerCase();
      return hay.includes(q);
    });
  });

  ngOnInit(): void {
    forkJoin([
      this.companiesApi.getStats(),
      this.logsApi.getAll({ limit: 10 })
    ]).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: ([statsRes, logsRes]) => {
        this.stats.set(statsRes);
        this.recentLogs.set(logsRes.logs || []);
      },
      error: () => {}
    });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  setFilter(filter: 'all' | 'sent' | 'failed' | 'pending') {
    this.activityFilter.set(filter);
  }
}
