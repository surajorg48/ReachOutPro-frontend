import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateOrderResponse,
  PricingPreview,
  SubscriptionCoupon,
  SubscriptionPlan,
} from '../models/auth.model';
import { AuthService } from './auth.service';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly baseUrl = environment.apiUrl;

  getPlans(): Observable<{ data: SubscriptionPlan[] }> {
    return this.http.get<{ data: SubscriptionPlan[] }>(`${this.baseUrl}/subscription/plans`);
  }

  getStatus() {
    return this.http.get<{
      isSubscribed: boolean;
      subscriptionName: string;
      subscriptionExpiry: string | null;
      remainingEmailLimit: number;
      remainingExportLimit: number;
      daysRemaining?: number;
    }>(`${this.baseUrl}/subscription/status`);
  }

  preview(subscriptionId: string, couponCode?: string) {
    return this.http.post<PricingPreview>(`${this.baseUrl}/subscription/preview`, {
      subscriptionId,
      couponCode,
    });
  }

  validateCoupon(subscriptionId: string, couponCode: string) {
    return this.http.post<{
      valid: boolean;
      message: string;
      couponCode: string;
      couponDiscount: number;
      finalAmount: number;
    }>(`${this.baseUrl}/subscription/validate-coupon`, {subscriptionId, couponCode});
  }

  createOrder(subscriptionId: string, couponCode?: string): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${this.baseUrl}/subscription/create-order`, {
      subscriptionId,
      couponCode,
    });
  }

  verifyPayment(body: {
    subscriptionId: string;
    orderId: string;
    paymentId: string;
    signature: string;
  }) {
    return this.http.post<{ message: string }>(`${this.baseUrl}/subscription/verify`, body);
  }

  getHistory() {
    return this.http.get<{ data: any[] }>(`${this.baseUrl}/subscription/history`);
  }

  getInvoice(id: string) {
    return this.http.get(`${this.baseUrl}/subscription/invoice/${id}`);
  }

  checkout(plan: SubscriptionPlan, couponCode?: string): Observable<{ message: string }> {
    return this.createOrder(plan.id, couponCode).pipe(
      switchMap((order) =>
        from(this.loadRazorpayScript()).pipe(switchMap(() => this.openCheckout(plan, order))),
      ),
    );
  }

  // Admin APIs
  adminListPlans() {
    return this.http.get<{ data: SubscriptionPlan[] }>(`${this.baseUrl}/admin/subscription-plans`);
  }

  adminCreatePlan(plan: Record<string, unknown>) {
    return this.http.post(`${this.baseUrl}/admin/subscription-plans`, plan);
  }

  adminUpdatePlan(id: string, plan: Record<string, unknown>) {
    return this.http.put(`${this.baseUrl}/admin/subscription-plans/${id}`, plan);
  }

  adminDeletePlan(id: string) {
    return this.http.delete(`${this.baseUrl}/admin/subscription-plans/${id}`);
  }

  adminSetStatus(id: string, status: 'active' | 'inactive') {
    return this.http.patch(`${this.baseUrl}/admin/subscription-plans/${id}/status`, { status });
  }

  adminListCoupons() {
    return this.http.get<{ data: SubscriptionCoupon[] }>(`${this.baseUrl}/admin/coupons`);
  }

  adminCreateCoupon(coupon: Record<string, unknown>) {
    return this.http.post(`${this.baseUrl}/admin/coupons`, coupon);
  }

  adminUpdateCoupon(id: string, coupon: Record<string, unknown>) {
    return this.http.put(`${this.baseUrl}/admin/coupons/${id}`, coupon);
  }

  adminDeleteCoupon(id: string) {
    return this.http.delete(`${this.baseUrl}/admin/coupons/${id}`);
  }

  adminSetCouponStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    return this.http.patch(`${this.baseUrl}/admin/coupons/${id}/status`, { status });
  }

  adminPurchases() {
    return this.http.get<{ data: any[] }>(`${this.baseUrl}/admin/subscription-purchases`);
  }

  adminReports() {
    return this.http.get(`${this.baseUrl}/admin/subscription-reports`);
  }

  private openCheckout(plan: SubscriptionPlan, order: CreateOrderResponse): Observable<{ message: string }> {
    return new Observable((observer) => {
      const user = this.authService.user();
      if (!window.Razorpay) {
        observer.error(new Error('Razorpay failed to load'));
        return;
      }

      const rzp = new window.Razorpay({
        key: order.razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'ReachOut Pro',
        description: plan.name,
        order_id: order.orderId,
        prefill: {
          email: user?.email ?? '',
          name: user?.fullName ?? '',
        },
        theme: { color: '#E85D3F' },
        handler: (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          this.verifyPayment({
            subscriptionId: plan.id,
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          })
            .pipe(tap(() => this.authService.getMe().subscribe()))
            .subscribe({
              next: (res) => {
                observer.next(res);
                observer.complete();
              },
              error: (err) => observer.error(err),
            });
        },
        modal: {
          ondismiss: () => observer.error(new Error('Payment cancelled')),
        },
      });

      rzp.open();
    });
  }

  private loadRazorpayScript(): Promise<void> {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });
  }
}

@Injectable({ providedIn: 'root' })
export class PremiumPopupService {
  readonly visible = signal(false);

  show(): void {
    this.visible.set(true);
  }

  hide(): void {
    this.visible.set(false);
  }
}
