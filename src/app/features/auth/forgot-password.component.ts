import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-shell">
        <div class="auth-form-panel">
          <div class="form-inner">
            <div class="brand-row">
              <img class="brand-logo" src="/assets/logo/logo.png" alt="ReachOut Pro" />
            </div>

            @if (step() === 'email') {
              <header class="form-header">
                <h1 class="form-title">Forgot password?</h1>
                <p class="form-subtitle">Enter your email and we’ll send a one-time code to help you get back in.</p>
              </header>

              <form (submit)="onSubmit($event)" class="auth-form">
                <label class="field">
                  <span class="field-label">Business email</span>
                  <input
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    placeholder="you@company.com"
                    required
                    [disabled]="loading()"
                    class="field-input"
                    autocomplete="email"
                  />
                </label>

                @if (error()) {
                  <div class="alert-error" role="alert">
                    <span>{{ error() }}</span>
                  </div>
                }

                <button type="submit" [disabled]="loading() || !email" class="btn-primary">
                  @if (loading()) {
                    <span class="spinner"></span>
                  } @else {
                    Send reset code
                  }
                </button>
              </form>

              <p class="card-footer">
                Remembered it? <a routerLink="/auth/login">Sign in</a>
              </p>
            }

            @if (step() === 'success') {
              <header class="form-header">
                <div class="success-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h1 class="form-title">Check your email</h1>
                <p class="form-subtitle">
                  If an account exists for <strong>{{ email }}</strong>, a one-time code is on its way.
                  Use it on the sign-in screen to continue.
                </p>
              </header>

              <a routerLink="/auth/login" class="btn-primary link-btn">Back to sign in</a>
            }

            <p class="legal">
              By continuing you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
            </p>
          </div>
        </div>

        <aside class="auth-visual-panel" aria-hidden="true">
          <div class="visual-glow visual-glow--a"></div>
          <div class="visual-glow visual-glow--b"></div>
          <div class="visual-content">
            <p class="visual-kicker">Account recovery</p>
            <h2 class="visual-title">We’ll get you back in</h2>
            <p class="visual-copy">Secure OTP access — no password required for ReachOut Pro.</p>
          </div>
          <div class="float-card">
            <div class="float-card-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p class="float-card-label">Secure access</p>
              <p class="float-card-value">OTP verified</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Inter', system-ui, sans-serif;
      --auth-yellow: #FAD02E;
      --auth-ink: #111827;
      --auth-muted: #6B7280;
      --auth-border: rgba(17, 24, 39, 0.08);
    }

    .auth-page {
      min-height: 100vh;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 20px;
      background:
        radial-gradient(ellipse at 10% 0%, rgba(250, 208, 46, 0.12) 0%, transparent 45%),
        linear-gradient(160deg, #E5E7EB 0%, #F7F7F7 55%, #EEEEF0 100%);
    }

    .auth-shell {
      width: 100%;
      max-width: 1000px;
      min-height: 620px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-radius: 36px;
      overflow: hidden;
      background: #FFFFFF;
      box-shadow:
        0 4px 6px rgba(17, 24, 39, 0.02),
        0 24px 48px rgba(17, 24, 39, 0.08),
        0 0 0 1px rgba(17, 24, 39, 0.04);
    }

    .auth-form-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 36px;
      background:
        linear-gradient(165deg, rgba(255, 252, 240, 0.95) 0%, rgba(255, 255, 255, 0.88) 42%, rgba(247, 247, 247, 0.92) 100%);
    }

    .form-inner {
      width: 100%;
      max-width: 380px;
      display: flex;
      flex-direction: column;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
    }

    .brand-logo {
      display: block;
      height: 52px;
      width: auto;
      max-width: 260px;
      object-fit: contain;
      object-position: left center;
    }

    .brand-mark {
      display: none;
    }

    .brand-name {
      display: none;
    }

    .form-header { margin-bottom: 24px; }

    .form-title {
      margin: 0 0 8px;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      color: var(--auth-ink);
      line-height: 1.15;
    }

    .form-subtitle {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.55;
      color: var(--auth-muted);
    }

    .form-subtitle strong { color: var(--auth-ink); }

    .success-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: rgba(250, 208, 46, 0.2);
      color: #92400E;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #374151;
    }

    .field-input {
      width: 100%;
      height: 50px;
      padding: 0 18px;
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid var(--auth-border);
      border-radius: 16px;
      color: var(--auth-ink);
      font-size: 0.9375rem;
      font-family: inherit;
      outline: none;
      box-shadow: 0 2px 8px rgba(17, 24, 39, 0.03);
    }

    .field-input:focus {
      background: #FFFFFF;
      border-color: rgba(250, 208, 46, 0.85);
      box-shadow: 0 0 0 4px rgba(250, 208, 46, 0.22);
    }

    .field-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      height: 50px;
      width: 100%;
      margin-top: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 999px;
      background: var(--auth-yellow);
      color: var(--auth-ink);
      font-size: 0.95rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(250, 208, 46, 0.35);
      text-decoration: none;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .link-btn {
      box-sizing: border-box;
    }

    .alert-error {
      padding: 12px 14px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 14px;
      color: #DC2626;
      font-size: 0.8125rem;
    }

    .card-footer {
      margin: 22px 0 0;
      text-align: center;
      font-size: 0.875rem;
      color: var(--auth-muted);
    }

    .card-footer a {
      color: #92400E;
      font-weight: 650;
      text-decoration: none;
    }

    .legal {
      margin-top: 28px;
      text-align: center;
      font-size: 0.75rem;
      color: #9CA3AF;
    }

    .legal a {
      color: #6B7280;
      text-decoration: none;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(17, 24, 39, 0.2);
      border-top-color: var(--auth-ink);
      border-radius: 50%;
      animation: spin 0.65s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-visual-panel {
      position: relative;
      overflow: hidden;
      background: linear-gradient(155deg, #1F2937 0%, #111827 45%, #0B1220 100%);
      color: #FFFFFF;
      padding: 48px 40px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .visual-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(40px);
      pointer-events: none;
    }

    .visual-glow--a {
      width: 280px;
      height: 280px;
      top: -60px;
      right: -40px;
      background: rgba(250, 208, 46, 0.35);
    }

    .visual-glow--b {
      width: 220px;
      height: 220px;
      bottom: 80px;
      left: -60px;
      background: rgba(251, 191, 36, 0.18);
    }

    .visual-content {
      position: relative;
      z-index: 2;
      max-width: 320px;
      margin-bottom: 28px;
    }

    .visual-kicker {
      margin: 0 0 10px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(250, 208, 46, 0.9);
    }

    .visual-title {
      margin: 0 0 10px;
      font-size: 1.65rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.2;
    }

    .visual-copy {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.55;
      color: rgba(255, 255, 255, 0.68);
    }

    .float-card {
      position: absolute;
      z-index: 3;
      top: 120px;
      left: 40px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(16px);
      animation: floatY 5.5s ease-in-out infinite;
    }

    @keyframes floatY {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .float-card-icon {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: var(--auth-yellow);
      color: var(--auth-ink);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .float-card-label {
      margin: 0;
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.65);
    }

    .float-card-value {
      margin: 2px 0 0;
      font-size: 1rem;
      font-weight: 700;
    }

    @media (max-width: 900px) {
      .auth-page { padding: 16px; align-items: flex-start; }
      .auth-shell { grid-template-columns: 1fr; min-height: auto; border-radius: 28px; }
      .auth-visual-panel { display: none; }
      .auth-form-panel { padding: 32px 24px; }
    }
  `],
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);

  email = '';
  step = signal<'email' | 'success'>('email');
  loading = signal(false);
  error = signal('');

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.email || this.loading()) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.sendOtp(this.email).subscribe({
      next: () => {
        this.step.set('success');
        this.loading.set(false);
      },
      error: (err: any) => {
        // Still show success to avoid email enumeration; fall back to message if useful
        this.step.set('success');
        this.loading.set(false);
        if (err?.userMessage) {
          // Keep UI success; ignore detailed errors for recovery UX
        }
      },
    });
  }
}
