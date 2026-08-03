import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AuthService } from '../../core/services/auth.service';
import { PricingPreview, SubscriptionPlan } from '../../core/models/auth.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
})
export class SubscriptionComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  plans = signal<SubscriptionPlan[]>([]);
  history = signal<any[]>([]);
  loading = signal(true);
  buying = signal(false);
  error = signal('');
  user = this.authService.user;

  checkoutOpen = signal(false);
  selectedPlan = signal<SubscriptionPlan | null>(null);
  couponCode = '';
  couponMessage = signal('');
  couponError = signal('');
  preview = signal<PricingPreview | null>(null);
  applyingCoupon = signal(false);

  ngOnInit(): void {
    this.loadPlans();
    this.loadHistory();
  }

  loadPlans(): void {
    this.loading.set(true);
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

  loadHistory(): void {
    this.subscriptionService.getHistory().subscribe({
      next: (res) => this.history.set(res.data || []),
      error: () => {},
    });
  }

  openCheckout(plan: SubscriptionPlan): void {
    this.selectedPlan.set(plan);
    this.couponCode = '';
    this.couponMessage.set('');
    this.couponError.set('');
    this.checkoutOpen.set(true);
    this.refreshPreview();
  }

  closeCheckout(): void {
    this.checkoutOpen.set(false);
    this.selectedPlan.set(null);
    this.preview.set(null);
  }

  refreshPreview(): void {
    const plan = this.selectedPlan();
    if (!plan) return;
    this.subscriptionService.preview(plan.id, this.couponCode || undefined).subscribe({
      next: (p) => {
        this.preview.set(p);
        if (p.message) {
          this.couponMessage.set(p.message);
          this.couponError.set('');
        }
      },
      error: (err) => {
        this.couponError.set(err.userMessage || err.error?.message || 'Could not preview pricing');
      },
    });
  }

  applyCoupon(): void {
    const plan = this.selectedPlan();
    if (!plan || !this.couponCode.trim()) return;
    this.applyingCoupon.set(true);
    this.couponError.set('');
    this.subscriptionService.validateCoupon(plan.id, this.couponCode.trim()).subscribe({
      next: (res) => {
        this.applyingCoupon.set(false);
        this.couponMessage.set(res.message || 'Coupon Applied Successfully');
        this.couponError.set('');
        this.toast.success(res.message || 'Coupon applied');
        this.refreshPreview();
      },
      error: (err) => {
        this.applyingCoupon.set(false);
        const msg = err.userMessage || err.error?.message || 'Invalid Coupon';
        this.couponError.set(msg);
        this.couponMessage.set('');
        this.toast.error(msg);
      },
    });
  }

  removeCoupon(): void {
    this.couponCode = '';
    this.couponMessage.set('');
    this.couponError.set('');
    this.refreshPreview();
  }

  confirmPay(): void {
    const plan = this.selectedPlan();
    if (!plan || this.buying()) return;
    this.buying.set(true);
    this.error.set('');
    this.subscriptionService.checkout(plan, this.couponCode.trim() || undefined).subscribe({
      next: () => {
        this.buying.set(false);
        this.closeCheckout();
        this.toast.success('Subscription purchased successfully');
        this.authService.getMe().subscribe();
        this.loadHistory();
      },
      error: (err) => {
        this.buying.set(false);
        if (err.message !== 'Payment cancelled') {
          const msg = err.userMessage || err.message || 'Payment failed';
          this.error.set(msg);
          this.toast.error(msg);
        }
      },
    });
  }

  displayPrice(plan: SubscriptionPlan): number {
    return plan.offerActive && plan.offerPrice != null ? plan.offerPrice : plan.amount;
  }

  badgeClass(color?: string | null): string {
    const c = (color || 'orange').toLowerCase();
    if (c === 'green') return 'badge-green';
    if (c === 'red') return 'badge-red';
    return 'badge-orange';
  }
}
