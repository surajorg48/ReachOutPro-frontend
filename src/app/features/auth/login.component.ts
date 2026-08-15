import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { OtpInputComponent } from '../../shared/components/otp-input/otp-input.component';
import { GoogleLoginComponent } from './google-login/google-login.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OtpInputComponent, GoogleLoginComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loginMode = signal<'password' | 'otp'>('password');
  otpCode = signal('');
  step = signal<'email' | 'otp'>('email');
  loading = signal(false);
  error = signal('');

  onPasswordLogin(event: Event) {
    event.preventDefault();
    if (!this.email || !this.password || this.loading()) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.loginWithPassword(this.email, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.user?.['role'] === 'admin' || res.user?.['role'] === 'super_admin') {
          this.router.navigate(['/admin/plans']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err: any) => {
        this.error.set(err.userMessage || 'Invalid email or password');
        this.loading.set(false);
      },
    });
  }

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
