import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="err-page">
      <article class="err-card">
        <div class="err-code">404</div>
        <h1>Page not found</h1>
        <p>The page you’re looking for doesn’t exist or may have moved.</p>
        <a routerLink="/" class="err-btn">Back to home</a>
      </article>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .err-page {
        min-height: 70vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
        background: #F7F7F7;
      }

      .err-card {
        width: min(440px, 100%);
        background: #fff;
        border-radius: 24px;
        box-shadow: 0 12px 40px rgba(17, 17, 17, 0.08);
        border: 1px solid #F3F4F6;
        padding: 40px 32px;
        text-align: center;
      }

      .err-code {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 72px;
        height: 40px;
        padding: 0 14px;
        border-radius: 999px;
        background: #FDF0EC;
        color: #E85D3F;
        font-weight: 800;
        font-size: 0.875rem;
        letter-spacing: 0.08em;
        margin-bottom: 18px;
      }

      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: #111111;
      }

      p {
        margin: 10px 0 24px;
        color: #6B7280;
        font-size: 0.9375rem;
        line-height: 1.5;
      }

      .err-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #E85D3F;
        color: #fff;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.875rem;
        border-radius: 12px;
        padding: 12px 20px;
        box-shadow: 0 8px 20px rgba(232, 93, 63, 0.28);
      }

      .err-btn:hover {
        background: #D14E33;
      }
    `,
  ],
})
export class NotFoundComponent {}
