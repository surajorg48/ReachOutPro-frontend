import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionPlan } from '../../core/models/auth.model';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
})
export class SubscriptionComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private authService = inject(AuthService);

  plans = signal<SubscriptionPlan[]>([]);
  loading = signal(true);
  buying = signal<string | null>(null);
  error = signal('');
  user = this.authService.user;

  ngOnInit(): void {
    this.subscriptionService.getPlans().subscribe({
      next: (res) => {
        this.plans.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.userMessage || 'Failed to load plans');
        this.loading.set(false);
      },
    });
  }

  buy(plan: SubscriptionPlan): void {
    this.buying.set(plan.id);
    this.error.set('');
    this.subscriptionService.checkout(plan).subscribe({
      next: () => {
        this.buying.set(null);
        this.authService.getMe().subscribe();
      },
      error: (err) => {
        this.buying.set(null);
        if (err.message !== 'Payment cancelled') {
          this.error.set(err.userMessage || err.message || 'Payment failed');
        }
      },
    });
  }
}
