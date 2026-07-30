import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, Type } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
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

  pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#64748b',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12, weight: 600 },
        bodyColor: '#0f172a',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        cornerRadius: 8,
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
        ticks: { color: '#94a3b8', font: { size: 11 } }
      },
      y: {
        grid: { color: '#f1f5f9', tickLength: 0 },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#64748b',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12, weight: 600 },
        bodyColor: '#0f172a',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        cornerRadius: 8,
      }
    }
  };

  pieChartData = computed<ChartData<'doughnut'>>(() => {
    const s = this.stats();
    const notInterested = Math.max(0, s.total - s.contacted - s.pending);
    
    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColor: string[] = [];

    if (s.contacted > 0) { labels.push('Contacted'); data.push(s.contacted); backgroundColor.push('#10B981'); }
    if (s.pending > 0) { labels.push('Pending'); data.push(s.pending); backgroundColor.push('#F59E0B'); }
    if (notInterested > 0) { labels.push('Not Interested'); data.push(notInterested); backgroundColor.push('#EF4444'); }

    return {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderWidth: 0,
        hoverOffset: 4
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
        backgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#2563EB'],
        borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 } as any,
        borderSkipped: false,
        barPercentage: 0.6
      }]
    };
  });

  statCards = computed(() => {
    const s = this.stats();
    return [
      { label: 'Total Companies', value: s.total, icon: CompaniesIconComponent, color: 'blue' },
      { label: 'Emails Found', value: s.totalEmails, icon: MailIconComponent, color: 'sky' },
      { label: 'Pending Contact', value: s.pending, icon: ClockIconComponent, color: 'amber' },
      { label: 'Contacted', value: s.contacted, icon: CheckIconComponent, color: 'green' },
      { label: 'Sent Today', value: s.sentToday, icon: ZapIconComponent, color: 'pink' },
      { label: 'Total Failed', value: s.totalFailed, icon: AlertIconComponent, color: 'red' }
    ];
  });

  quickActions = [
    { label: 'Manage Companies', sub: 'View and organize your company list', icon: CompaniesIconComponent, color: '#3B82F6', path: '/companies' },
    { label: 'Scrape Emails', sub: 'Discover HR emails from websites', icon: ScraperIconComponent, color: '#0EA5E9', path: '/scraper' },
    { label: 'New Campaign', sub: 'Create and launch an email campaign', icon: CampaignIconComponent, color: '#2563EB', path: '/campaigns/new' },
    { label: 'Email Logs', sub: 'Track all sent emails', icon: LogsIconComponent, color: '#64748B', path: '/logs' },
  ];

  successRate = computed(() => {
    const s = this.stats();
    return s.totalSent > 0 ? Math.round(((s.totalSent - s.totalFailed) / s.totalSent) * 100) : 0;
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
      error: () => {} // Error handling preserved as silent per React codebase
    });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
