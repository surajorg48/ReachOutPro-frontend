import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  GoogleAuthError,
  GoogleAuthService,
} from '../../../core/services/google-auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-login.component.html',
  styleUrls: ['./google-login.component.scss'],
})
export class GoogleLoginComponent implements AfterViewInit, OnDestroy {
  private googleAuth = inject(GoogleAuthService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  /** 'signin' on login page, 'signup' on register page */
  readonly context = input<'signin' | 'signup'>('signin');
  /** Enable Google One Tap (optional) */
  readonly enableOneTap = input(true);
  /** Navigate after success (default dashboard `/`) */
  readonly redirectTo = input('/');

  readonly signedIn = output<void>();
  readonly failed = output<string>();

  @ViewChild('googleBtnHost') googleBtnHost?: ElementRef<HTMLDivElement>;

  readonly loading = signal(false);
  readonly error = signal('');
  readonly ready = signal(false);
  readonly configured = signal(false);

  private resizeObserver: ResizeObserver | null = null;
  private destroyed = false;

  async ngAfterViewInit(): Promise<void> {
    this.configured.set(this.googleAuth.isConfigured());

    if (this.authService.isAuthenticated()) {
      this.error.set('You are already signed in');
      this.failed.emit('ALREADY_LOGGED_IN');
      return;
    }

    if (!this.configured()) {
      this.error.set('Google Sign-In is not configured');
      return;
    }

    try {
      await this.googleAuth.initialize({
        context: this.context(),
        autoSelect: false,
        onCredential: (idToken: string) => void this.exchangeToken(idToken),
      });

      if (this.destroyed) return;

      await this.renderGoogleButton();
      this.ready.set(true);
      this.error.set('');

      if (this.enableOneTap()) {
        void this.googleAuth.promptOneTap();
      }

      const host = this.googleBtnHost?.nativeElement;
      if (host && typeof ResizeObserver !== 'undefined') {
        let timer: number | undefined;
        this.resizeObserver = new ResizeObserver(() => {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            if (!this.destroyed && this.ready()) {
              void this.renderGoogleButton().catch(() => undefined);
            }
          }, 150);
        });
        this.resizeObserver.observe(host);
      }
    } catch (err) {
      console.error('[GoogleLogin] init failed:', err);
      this.handleInitError(err);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private async renderGoogleButton(): Promise<void> {
    const el = this.googleBtnHost?.nativeElement;
    if (!el) {
      throw new GoogleAuthError('UNKNOWN', 'Google button host is not ready');
    }
    const width = Math.min(Math.max(el.clientWidth || 320, 240), 400);
    await this.googleAuth.renderButton(el, {
      width,
      text: 'continue_with',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
    });
  }

  private exchangeToken(idToken: string): void {
    if (this.loading()) return;

    if (!idToken) {
      this.error.set('Invalid Google token');
      this.toast.error('Invalid Google token');
      this.failed.emit('INVALID_TOKEN');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.loginWithGoogle(idToken).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Signed in with Google');
        this.signedIn.emit();
        void this.router.navigateByUrl(this.redirectTo());
      },
      error: (err: unknown) => {
        this.loading.set(false);
        const message = this.mapBackendError(err);
        this.error.set(message);
        this.toast.error(message);
        this.failed.emit(message);
      },
    });
  }

  private handleInitError(err: unknown): void {
    let message = 'Google Sign-In failed to initialize';

    if (err instanceof GoogleAuthError) {
      message = err.message;
    } else if (err instanceof Error && err.message) {
      message = err.message;
    }

    // Common misconfig: origin not allowlisted
    if (/origin/i.test(message) || /The given origin is not allowed/i.test(message)) {
      message = `This site origin (${window.location.origin}) is not allowed for Google Sign-In. Add it in Google Cloud Console → Credentials → Authorized JavaScript origins.`;
    }

    this.error.set(message);
    this.failed.emit(message);
    this.toast.error(message);
  }

  private mapBackendError(err: unknown): string {
    const e = err as {
      status?: number;
      userMessage?: string;
      error?: {message?: string; error?: {message?: string}};
      message?: string;
    };

    if (e?.status === 0) {
      return 'Network error — could not reach the server';
    }
    if (e?.status === 401) {
      return e.userMessage || 'Unauthorized — invalid or expired Google token';
    }
    if (e?.status === 423) {
      return e.userMessage || 'Account is temporarily locked';
    }

    return (
      e?.userMessage ||
      e?.error?.error?.message ||
      e?.error?.message ||
      e?.message ||
      'Google sign-in failed'
    );
  }
}
