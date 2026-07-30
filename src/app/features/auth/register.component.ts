import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { OtpInputComponent } from '../../shared/components/otp-input/otp-input.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OtpInputComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  form = {
    organizationName: '',
    fullName: '',
    email: '',
    phone: '',
  };

  otpCode = signal('');
  step = signal<'form' | 'otp'>('form');
  loading = signal(false);
  error = signal('');

  isValid(): boolean {
    return !!(this.form.organizationName && this.form.fullName && this.form.email);
  }

  async onRegister(event: Event) {
    event.preventDefault();
    if (!this.isValid() || this.loading()) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.register(this.form).subscribe({
      next: () => {
        this.step.set('otp');
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.userMessage || 'Registration failed');
        this.loading.set(false);
      },
    });
  }

  onOtpComplete(code: string) {
    this.otpCode.set(code);
  }

  onVerifyOtp() {
    if (this.otpCode().length !== 6 || this.loading()) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.verifyOtp(this.form.email, this.otpCode(), 'registration').subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: any) => {
        this.error.set(err.userMessage || 'Invalid OTP');
        this.loading.set(false);
      },
    });
  }

  onResendOtp() {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.sendOtp(this.form.email, 'registration').subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.userMessage || 'Failed to resend');
        this.loading.set(false);
      },
    });
  }

  goBack() {
    this.step.set('form');
    this.otpCode.set('');
    this.error.set('');
  }
}
