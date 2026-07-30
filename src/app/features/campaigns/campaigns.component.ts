import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CampaignsService } from '../../core/services/campaigns.service';
import { Campaign } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent implements OnInit {
  private campaignsApi = inject(CampaignsService);
  private toast = inject(ToastService);
  public router = inject(Router);

  campaigns = signal<Campaign[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.campaignsApi.getAll().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res) => this.campaigns.set(res),
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleDelete(id: number) {
    if (!confirm('Delete this campaign?')) return;
    this.campaignsApi.delete(id).subscribe({
      next: () => this.load(),
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
