import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionCoupon } from '../../core/models/auth.model';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-coupons.component.html',
  styleUrls: ['./admin-coupons.component.scss'],
})
export class AdminCouponsComponent implements OnInit {
  private api = inject(SubscriptionService);
  private auth = inject(AuthService);
  private router = inject(Router);

  coupons = signal<SubscriptionCoupon[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  message = signal('');
  error = signal('');

  form = {
    couponCode: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 30,
    minimumAmount: 0,
    maximumDiscount: null as number | null,
    expiryDate: '',
    usageLimit: null as number | null,
    perUserLimit: 1,
    applicablePlans: '',
    status: 'ACTIVE',
  };

  ngOnInit(): void {
    if (!this.auth.hasRole('admin')) {
      this.router.navigate(['/']);
      return;
    }
    this.load();
  }

  load(): void {
    this.api.adminListCoupons().subscribe({
      next: (res) => this.coupons.set(res.data),
      error: (err) => this.error.set(err.userMessage || 'Failed to load coupons'),
    });
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form = {
      couponCode: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 30,
      minimumAmount: 0,
      maximumDiscount: null,
      expiryDate: '',
      usageLimit: null,
      perUserLimit: 1,
      applicablePlans: '',
      status: 'ACTIVE',
    };
    this.showForm.set(true);
  }

  edit(c: SubscriptionCoupon): void {
    this.editingId.set(c.id);
    this.form = {
      couponCode: c.couponCode,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minimumAmount: c.minimumAmount,
      maximumDiscount: c.maximumDiscount,
      expiryDate: c.expiryDate ? String(c.expiryDate).slice(0, 16) : '',
      usageLimit: c.usageLimit ?? null,
      perUserLimit: c.perUserLimit,
      applicablePlans: c.applicablePlans || '',
      status: c.status,
    };
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  save(event: Event): void {
    event.preventDefault();
    const id = this.editingId();
    const body = {
      ...this.form,
      couponCode: this.form.couponCode.toUpperCase(),
      expiryDate: this.form.expiryDate || null,
    };
    const req = id ? this.api.adminUpdateCoupon(id, body) : this.api.adminCreateCoupon(body);
    req.subscribe({
      next: () => {
        this.message.set(id ? 'Coupon updated' : 'Coupon created');
        this.showForm.set(false);
        this.load();
      },
      error: (err) => this.error.set(err.userMessage || 'Save failed'),
    });
  }

  toggle(c: SubscriptionCoupon): void {
    const next = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.api.adminSetCouponStatus(c.id, next).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.userMessage || 'Update failed'),
    });
  }

  remove(c: SubscriptionCoupon): void {
    if (!confirm(`Delete coupon ${c.couponCode}?`)) return;
    this.api.adminDeleteCoupon(c.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.userMessage || 'Delete failed'),
    });
  }
}
