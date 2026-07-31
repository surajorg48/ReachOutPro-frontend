import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import type {
  GoogleCredentialResponse,
  GooglePromptNotification,
} from '../types/google-gsi';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_SCRIPT_ID = 'google-gsi-client';

export type GoogleAuthErrorCode =
  | 'SCRIPT_FAILED'
  | 'NOT_CONFIGURED'
  | 'POPUP_CLOSED'
  | 'INVALID_TOKEN'
  | 'ALREADY_LOGGED_IN'
  | 'CANCELLED'
  | 'ORIGIN'
  | 'UNKNOWN';

export class GoogleAuthError extends Error {
  constructor(
    public readonly code: GoogleAuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly clientId = (environment.googleClientId || '').trim();
  private scriptPromise: Promise<void> | null = null;
  private initialized = false;
  private activeCredentialHandler: ((idToken: string) => void) | null = null;

  readonly scriptReady = signal(false);
  readonly loading = signal(false);

  isConfigured(): boolean {
    return (
      !!this.clientId &&
      !this.clientId.includes('YOUR_GOOGLE_CLIENT_ID') &&
      this.clientId.includes('.apps.googleusercontent.com')
    );
  }

  getClientId(): string {
    return this.clientId;
  }

  /** Dynamically load GIS script once, then wait until google.accounts.id exists. */
  loadScript(): Promise<void> {
    if (!this.isConfigured()) {
      return Promise.reject(
        new GoogleAuthError('NOT_CONFIGURED', 'Google Client ID is not configured'),
      );
    }

    if (window.google?.accounts?.id) {
      this.scriptReady.set(true);
      return Promise.resolve();
    }

    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      const fail = (message: string) => {
        this.scriptPromise = null;
        reject(new GoogleAuthError('SCRIPT_FAILED', message));
      };

      const finishWhenReady = () => {
        void this.waitForGoogleApi()
          .then(() => {
            this.scriptReady.set(true);
            resolve();
          })
          .catch(() =>
            fail(
              'Google Identity Services loaded but google.accounts.id is unavailable',
            ),
          );
      };

      const existing = document.getElementById(GIS_SCRIPT_ID) as HTMLScriptElement | null;
      if (existing) {
        if (window.google?.accounts?.id) {
          finishWhenReady();
          return;
        }
        existing.addEventListener('load', finishWhenReady, {once: true});
        existing.addEventListener(
          'error',
          () => fail('Google Sign-In script failed to load'),
          {once: true},
        );
        // Script may already be loaded without firing load again
        window.setTimeout(() => {
          if (window.google?.accounts?.id) {
            finishWhenReady();
          }
        }, 50);
        return;
      }

      const script = document.createElement('script');
      script.id = GIS_SCRIPT_ID;
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = finishWhenReady;
      script.onerror = () => fail('Google Sign-In script failed to load. Check network / ad blockers.');
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }

  /**
   * Initialize google.accounts.id with a credential callback.
   * Safe to call multiple times — rebinds callback for the active flow.
   */
  async initialize(options?: {
    autoSelect?: boolean;
    context?: 'signin' | 'signup' | 'use';
    onCredential?: (idToken: string) => void;
  }): Promise<void> {
    await this.loadScript();

    if (!window.google?.accounts?.id) {
      throw new GoogleAuthError('SCRIPT_FAILED', 'Google Identity Services is unavailable');
    }

    this.activeCredentialHandler = options?.onCredential ?? null;

    try {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: GoogleCredentialResponse) => {
          this.handleCredentialResponse(response);
        },
        auto_select: options?.autoSelect ?? false,
        cancel_on_tap_outside: true,
        context: options?.context ?? 'signin',
        ux_mode: 'popup',
        itp_support: true,
        // FedCM can break init on some browsers/origins — keep off by default
        use_fedcm_for_prompt: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/origin|client_id|invalid/i.test(message)) {
        throw new GoogleAuthError(
          'ORIGIN',
          `Google rejected this origin (${window.location.origin}). Add it under Authorized JavaScript origins in Google Cloud Console.`,
        );
      }
      throw new GoogleAuthError('UNKNOWN', message || 'Google initialize() failed');
    }

    this.initialized = true;
  }

  /** Render the official Google button into a host element. */
  async renderButton(
    element: HTMLElement,
    options?: {
      width?: number;
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    },
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!window.google?.accounts?.id) {
      throw new GoogleAuthError('SCRIPT_FAILED', 'Google Identity Services is unavailable');
    }

    if (!element) {
      throw new GoogleAuthError('UNKNOWN', 'Google button host element is missing');
    }

    element.innerHTML = '';
    const width = Math.min(
      Math.max(options?.width ?? element.clientWidth ?? 320, 240),
      400,
    );

    try {
      window.google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: options?.theme ?? 'outline',
        size: options?.size ?? 'large',
        text: options?.text ?? 'continue_with',
        shape: options?.shape ?? 'rectangular',
        logo_alignment: 'left',
        width,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new GoogleAuthError(
        'UNKNOWN',
        message || 'Failed to render Google Sign-In button',
      );
    }
  }

  /** Optional One Tap — never throws (soft-fail). */
  async promptOneTap(): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      window.google?.accounts?.id?.prompt((notification: GooglePromptNotification) => {
        if (notification.isNotDisplayed()) {
          console.debug('[GoogleAuth] One Tap not displayed:', notification.getNotDisplayedReason());
        } else if (notification.isSkippedMoment()) {
          console.debug('[GoogleAuth] One Tap skipped:', notification.getSkippedReason());
        }
      });
    } catch (err) {
      console.debug('[GoogleAuth] One Tap unavailable:', err);
    }
  }

  disableAutoSelect(): void {
    try {
      window.google?.accounts?.id?.disableAutoSelect();
    } catch {
      // ignore
    }
  }

  private async waitForGoogleApi(timeoutMs = 8000): Promise<void> {
    const started = Date.now();
    while (!window.google?.accounts?.id) {
      if (Date.now() - started > timeoutMs) {
        throw new Error('timeout');
      }
      await new Promise((r) => setTimeout(r, 40));
    }
  }

  private handleCredentialResponse(response: GoogleCredentialResponse): void {
    const idToken = response?.credential;
    if (!idToken) {
      console.error('[GoogleAuth] Empty credential from Google');
      return;
    }
    this.activeCredentialHandler?.(idToken);
  }
}
