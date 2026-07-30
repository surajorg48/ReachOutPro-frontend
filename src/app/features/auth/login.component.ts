import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { OtpInputComponent } from '../../shared/components/otp-input/otp-input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OtpInputComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  otpCode = signal('');
  step = signal<'email' | 'otp'>('email');
  loading = signal(false);
  error = signal('');

  async onSendOtp(event: Event) {
    event.preventDefault();
    if (!this.email || this.loading()) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.sendOtp(this.email).subscribe({
      next: () => {
        this.step.set('otp');
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.userMessage || 'Failed to send OTP');
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

    this.authService.verifyOtp(this.email, this.otpCode(), 'login').subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
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

    this.authService.sendOtp(this.email).subscribe({
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
    this.step.set('email');
    this.otpCode.set('');
    this.error.set('');
  }
}
