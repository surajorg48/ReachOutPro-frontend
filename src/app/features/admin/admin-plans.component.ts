import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionPlan } from '../../core/models/auth.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    validityDays: 30,
    emailLimit: 100,
    exportLimit: 10,
    status: 'active' as string,
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
      next: (res) => this.plans.set(res.data.map(p => ({
        ...p,
        validityDays: (p as any).validityDays ?? (p as any).validity_days ?? 30,
        emailLimit: (p as any).emailLimit ?? (p as any).email_limit ?? 0,
        exportLimit: (p as any).exportLimit ?? (p as any).export_limit ?? 0,
      }))),
      error: (err) => this.error.set(err.userMessage || 'Failed to load plans'),
    });
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form = { name: '', description: '', amount: 0, validityDays: 30, emailLimit: 100, exportLimit: 10, status: 'active' };
    this.showForm.set(true);
  }

  edit(plan: SubscriptionPlan): void {
    this.editingId.set(plan.id);
    this.form = {
      name: plan.name,
      description: plan.description,
      amount: plan.amount,
      validityDays: plan.validityDays,
      emailLimit: plan.emailLimit,
      exportLimit: plan.exportLimit,
      status: plan.status ?? 'active',
    };
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  savePlan(event: Event): void {
    event.preventDefault();
    const id = this.editingId();
    const req = id
      ? this.subscriptionService.adminUpdatePlan(id, this.form)
      : this.subscriptionService.adminCreatePlan(this.form);

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
