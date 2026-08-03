import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionPlan } from '../../core/models/auth.model';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-plans.component.html',
  styleUrls: ['./admin-plans.component.scss'],
})
export class AdminPlansComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private authService = inject(AuthService);
  private router = inject(Router);

  plans = signal<SubscriptionPlan[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  message = signal('');
  error = signal('');

  form = {
    name: '',
    description: '',
    amount: 0,
    durationType: 'MONTH',
    duration: 1,
    validityDays: 30,
    emailLimit: 100,
    exportLimit: 10,
    status: 'active' as string,
    offerEnabled: false,
    offerPercentage: 0,
    offerStart: '',
    offerEnd: '',
    badgeText: '',
    badgeColor: 'orange',
    recommendedPlan: false,
    features: '',
  };

  ngOnInit(): void {
    if (!this.authService.hasRole('admin')) {
      this.router.navigate(['/']);
      return;
    }
    this.loadPlans();
  }

  loadPlans(): void {
    this.subscriptionService.adminListPlans().subscribe({
      next: (res) =>
        this.plans.set(
          res.data.map((p: any) => ({
            ...p,
            validityDays: p.validityDays ?? 30,
            emailLimit: p.emailLimit ?? 0,
            exportLimit: p.exportLimit ?? 0,
            durationType: p.durationType ?? 'DAY',
            duration: p.duration ?? p.validityDays ?? 30,
            offerEnabled: !!p.offerEnabled,
            offerPercentage: p.offerPercentage ?? 0,
            recommendedPlan: !!p.recommendedPlan,
          })),
        ),
      error: (err) => this.error.set(err.userMessage || 'Failed to load plans'),
    });
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form = {
      name: '',
      description: '',
      amount: 0,
      durationType: 'MONTH',
      duration: 1,
      validityDays: 30,
      emailLimit: 100,
      exportLimit: 10,
      status: 'active',
      offerEnabled: false,
      offerPercentage: 0,
      offerStart: '',
      offerEnd: '',
      badgeText: '',
      badgeColor: 'orange',
      recommendedPlan: false,
      features: '',
    };
    this.showForm.set(true);
  }

  edit(plan: SubscriptionPlan): void {
    this.editingId.set(plan.id);
    this.form = {
      name: plan.name,
      description: plan.description,
      amount: plan.amount,
      durationType: plan.durationType || 'MONTH',
      duration: plan.duration || 1,
      validityDays: plan.validityDays,
      emailLimit: plan.emailLimit,
      exportLimit: plan.exportLimit,
      status: plan.status ?? 'active',
      offerEnabled: !!plan.offerEnabled,
      offerPercentage: plan.offerPercentage || 0,
      offerStart: (plan.offerStart || '').toString().slice(0, 16),
      offerEnd: (plan.offerEnd || '').toString().slice(0, 16),
      badgeText: plan.badgeText || '',
      badgeColor: plan.badgeColor || 'orange',
      recommendedPlan: !!(plan.recommendedPlan || plan.recommended),
      features: Array.isArray(plan.features)
        ? plan.features.join('\n')
        : (plan as any).features || '',
    };
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  payload() {
    return {
      name: this.form.name,
      description: this.form.description,
      amount: this.form.amount,
      durationType: this.form.durationType,
      duration: this.form.duration,
      validityDays: this.form.validityDays,
      emailLimit: this.form.emailLimit,
      exportLimit: this.form.exportLimit,
      status: this.form.status,
      offerEnabled: this.form.offerEnabled,
      offerPercentage: this.form.offerPercentage,
      offerStart: this.form.offerStart || null,
      offerEnd: this.form.offerEnd || null,
      badgeText: this.form.badgeText || null,
      badgeColor: this.form.badgeColor,
      recommendedPlan: this.form.recommendedPlan,
      features: this.form.features,
    };
  }

  savePlan(event: Event): void {
    event.preventDefault();
    const id = this.editingId();
    const body = this.payload();
    const req = id
      ? this.subscriptionService.adminUpdatePlan(id, body)
      : this.subscriptionService.adminCreatePlan(body);

    req.subscribe({
      next: () => {
        this.message.set(id ? 'Plan updated' : 'Plan created');
        this.showForm.set(false);
        this.loadPlans();
      },
      error: (err) => this.error.set(err.userMessage || 'Save failed'),
    });
  }

  toggleStatus(plan: SubscriptionPlan, status: 'active' | 'inactive'): void {
    this.subscriptionService.adminSetStatus(plan.id, status).subscribe({
      next: () => this.loadPlans(),
      error: (err) => this.error.set(err.userMessage || 'Update failed'),
    });
  }

  remove(plan: SubscriptionPlan): void {
    if (!confirm(`Delete plan "${plan.name}"?`)) return;
    this.subscriptionService.adminDeletePlan(plan.id).subscribe({
      next: () => {
        this.message.set('Plan deleted');
        this.loadPlans();
      },
      error: (err) => this.error.set(err.userMessage || 'Delete failed'),
    });
  }
}
