import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  success(message: string): void {
    this.show(message, 'toast-success');
  }

  error(message: string): void {
    this.show(message, 'toast-error');
  }

  info(message: string): void {
    this.show(message, 'toast-info');
  }

  private show(message: string, cssClass: string): void {
    const container = this.getContainer();
    const el = document.createElement('div');
    el.className = `toast-notification ${cssClass}`;
    el.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.className = 'toast-close';
    closeBtn.onclick = () => el.remove();
    el.appendChild(closeBtn);

    container.appendChild(el);
    setTimeout(() => el.remove(), cssClass === 'toast-error' ? 5000 : 3000);
  }

  private getContainer(): HTMLDivElement {
    let c = document.getElementById('toast-container') as HTMLDivElement;
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.style.cssText = 'position:fixed;top:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(c);
    }
    return c;
  }
}
