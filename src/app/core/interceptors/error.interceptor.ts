import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { PremiumPopupService } from '../services/subscription.service';
import { ToastService } from '../services/toast.service';

function extractMessage(error: any): string {
  let message = 'An unexpected error occurred';
  const body = error?.error;

  if (body instanceof Blob) {
    return message;
  }

  if (typeof body === 'string' && body.trim()) {
    message = body;
  } else if (body && typeof body === 'object') {
    if (typeof body.error === 'string') {
      message = body.error;
    } else if (body.error?.message) {
      message = body.error.message;
    } else if (body.message) {
      message = body.message;
    }
  } else if (error?.message && !String(error.message).startsWith('Http failure')) {
    message = error.message;
  }

  return message;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const premiumPopup = inject(PremiumPopupService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error) => {
      let message = extractMessage(error);

      if (error.status === 403 && /upgrade to pro plan/i.test(message)) {
        premiumPopup.show();
      } else if (error.status === 401) {
        if (!message || message === 'An unexpected error occurred') {
          message = 'Your session expired. Please sign in again.';
        }
      } else if (error.status === 413) {
        message = message || 'File is too large.';
      } else if (error.status === 415) {
        message = message || 'Unsupported file type.';
      } else if (error.status === 429) {
        if (!/second/i.test(message)) {
          message = 'Please wait a moment before trying again.';
        }
      } else if (error.status === 0) {
        message = 'Cannot connect to server. Please check your connection.';
      } else if (error.status >= 500) {
        // Prefer backend message when it is already user-safe
        if (!message || /internal server error|sql|stack|unknown column/i.test(message)) {
          message = 'Server error. Please try again later.';
        }
      }

      // Avoid toast spam on auth refresh / silent probes
      const silent =
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/me') ||
        req.headers.has('X-Silent-Error');

      if (!silent && error.status !== 403) {
        toast.error(message);
      }

      console.error(`[HTTP Error] ${error.status}: ${message}`);
      return throwError(() => ({ ...error, userMessage: message }));
    }),
  );
};
