import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

export type FintechShellKind = 'table' | 'kpis' | 'docs' | 'settings' | 'empty';

interface ShellData {
  title: string;
  subtitle: string;
  section: string;
  kind: FintechShellKind;
}

interface MockRow {
  id: string;
  name: string;
  meta: string;
  amount: string;
  status: 'active' | 'pending' | 'closed' | 'failed';
  date: string;
}

interface MockDoc {
  name: string;
  size: string;
  type: string;
  updated: string;
}

@Component({
  selector: 'app-fintech-shell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="ft-page">
      <header class="ft-header">
        <nav class="ft-breadcrumb" aria-label="Breadcrumb">
          <span class="ft-crumb-section">{{ data().section }}</span>
          <span class="ft-crumb-sep" aria-hidden="true">/</span>
          <span class="ft-crumb-title">{{ data().title }}</span>
        </nav>
        <div class="ft-header-row">
          <div>
            <h1 class="ft-title">{{ data().title }}</h1>
            <p class="ft-subtitle">{{ data().subtitle }}</p>
          </div>
          @if (data().kind === 'table' || data().kind === 'docs') {
            <button type="button" class="ft-btn-primary">
              {{ data().kind === 'docs' ? 'Upload file' : 'Create new' }}
            </button>
          }
        </div>
      </header>

      @switch (data().kind) {
        @case ('kpis') {
          <section class="ft-kpi-grid">
            @for (kpi of kpis; track kpi.label) {
              <article class="ft-card ft-kpi">
                <div class="ft-kpi-top">
                  <span class="ft-kpi-label">{{ kpi.label }}</span>
                  <span class="ft-kpi-delta" [class.up]="kpi.up" [class.down]="!kpi.up">
                    {{ kpi.delta }}
                  </span>
                </div>
                <div class="ft-kpi-value">{{ kpi.value }}</div>
                <div class="ft-kpi-hint">{{ kpi.hint }}</div>
              </article>
            }
          </section>
          <article class="ft-card ft-chart">
            <div class="ft-chart-head">
              <div>
                <h2 class="ft-card-title">Performance overview</h2>
                <p class="ft-card-sub">Mock trend for the last 30 days</p>
              </div>
              <div class="ft-pills">
                <button type="button" class="ft-pill active">30D</button>
                <button type="button" class="ft-pill">90D</button>
                <button type="button" class="ft-pill">1Y</button>
              </div>
            </div>
            <div class="ft-chart-body" aria-hidden="true">
              <div class="ft-chart-bars">
                @for (h of chartHeights; track $index) {
                  <span class="ft-bar" [style.height.%]="h"></span>
                }
              </div>
              <div class="ft-chart-overlay">
                <span>Chart placeholder</span>
              </div>
            </div>
          </article>
        }

        @case ('table') {
          <section class="ft-card ft-table-wrap">
            <div class="ft-toolbar">
              <div class="ft-search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="search" placeholder="Search records…" disabled />
              </div>
              <div class="ft-pills">
                @for (f of filters; track f) {
                  <button type="button" class="ft-pill" [class.active]="f === 'All'">{{ f }}</button>
                }
              </div>
            </div>
            <div class="ft-table-scroll">
              <table class="ft-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Details</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of tableRows; track row.id) {
                    <tr [class.clickable]="data().title === 'Loan Applications'" (click)="onRowClick(row)">
                      <td class="mono">
                        @if (data().title === 'Loan Applications') {
                          <a [routerLink]="['/loans', row.id]" (click)="$event.stopPropagation()">{{ row.id }}</a>
                        } @else {
                          {{ row.id }}
                        }
                      </td>
                      <td class="strong">{{ row.name }}</td>
                      <td class="muted">{{ row.meta }}</td>
                      <td class="mono">{{ row.amount }}</td>
                      <td>
                        <span class="ft-badge" [attr.data-status]="row.status">{{ row.status }}</span>
                      </td>
                      <td class="muted">{{ row.date }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="ft-pagination">
              <span class="muted">Showing 1–8 of 48</span>
              <div class="ft-page-btns">
                <button type="button" class="ft-page-btn" disabled>Prev</button>
                <button type="button" class="ft-page-btn active">1</button>
                <button type="button" class="ft-page-btn">2</button>
                <button type="button" class="ft-page-btn">3</button>
                <button type="button" class="ft-page-btn">Next</button>
              </div>
            </div>
          </section>
        }

        @case ('docs') {
          <div class="ft-docs-grid">
            <article class="ft-card ft-dropzone">
              <div class="ft-drop-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <h2 class="ft-card-title">Drop files here</h2>
              <p class="ft-card-sub">PDF, PNG, or JPG up to 25 MB — mock upload only</p>
              <button type="button" class="ft-btn-primary">Browse files</button>
            </article>
            <article class="ft-card">
              <h2 class="ft-card-title">Recent documents</h2>
              <ul class="ft-doc-list">
                @for (doc of documents; track doc.name) {
                  <li class="ft-doc-item">
                    <div class="ft-doc-icon">{{ doc.type }}</div>
                    <div class="ft-doc-meta">
                      <span class="strong">{{ doc.name }}</span>
                      <span class="muted">{{ doc.size }} · {{ doc.updated }}</span>
                    </div>
                    <button type="button" class="ft-link-btn">View</button>
                  </li>
                }
              </ul>
            </article>
          </div>
        }

        @case ('settings') {
          <article class="ft-card ft-form-card">
            <h2 class="ft-card-title">{{ data().title }} settings</h2>
            <p class="ft-card-sub">Mock form — fields are disabled</p>
            <form class="ft-form" (submit)="$event.preventDefault()">
              <label class="ft-float">
                <input type="text" placeholder=" " value="Alex Morgan" disabled />
                <span>Full name</span>
              </label>
              <label class="ft-float">
                <input type="email" placeholder=" " value="alex@company.com" disabled />
                <span>Email address</span>
              </label>
              <label class="ft-float">
                <input type="text" placeholder=" " value="+1 (555) 014-2288" disabled />
                <span>Phone</span>
              </label>
              <label class="ft-float">
                <select disabled>
                  <option>United States</option>
                  <option>India</option>
                  <option>United Kingdom</option>
                </select>
                <span>Region</span>
              </label>
              <label class="ft-float ft-float-area">
                <textarea rows="3" placeholder=" " disabled>Prefer email updates for EMI and payment reminders.</textarea>
                <span>Notes</span>
              </label>
              <div class="ft-form-actions">
                <button type="button" class="ft-btn-ghost" disabled>Cancel</button>
                <button type="button" class="ft-btn-primary" disabled>Save changes</button>
              </div>
            </form>
          </article>
        }

        @case ('empty') {
          <article class="ft-card ft-empty">
            <div class="ft-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M9 12h6"/><path d="M12 9v6"/>
              </svg>
            </div>
            <h2 class="ft-card-title">Nothing here yet</h2>
            <p class="ft-card-sub">{{ data().subtitle }}</p>
            <a routerLink="/" class="ft-btn-primary">Back to dashboard</a>
          </article>
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #111111;
      }

      .ft-page {
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding: 8px 4px 32px;
        max-width: 1200px;
      }

      .ft-header {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ft-breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #9CA3AF;
      }

      .ft-crumb-title {
        color: #E85D3F;
      }

      .ft-crumb-sep {
        color: #D1D5DB;
      }

      .ft-header-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .ft-title {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: #111111;
      }

      .ft-subtitle {
        margin: 6px 0 0;
        color: #6B7280;
        font-size: 0.9375rem;
        max-width: 52ch;
        line-height: 1.5;
      }

      .ft-card {
        background: #ffffff;
        border-radius: 22px;
        box-shadow: 0 10px 30px rgba(17, 17, 17, 0.05);
        border: 1px solid #F3F4F6;
        padding: 22px;
      }

      .ft-card-title {
        margin: 0;
        font-size: 1.0625rem;
        font-weight: 700;
        color: #111111;
      }

      .ft-card-sub {
        margin: 6px 0 0;
        color: #9CA3AF;
        font-size: 0.8125rem;
      }

      .ft-btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: none;
        border-radius: 12px;
        background: #E85D3F;
        color: #fff;
        font-weight: 600;
        font-size: 0.875rem;
        padding: 11px 18px;
        cursor: pointer;
        text-decoration: none;
        box-shadow: 0 8px 20px rgba(232, 93, 63, 0.28);
        transition: background 0.15s ease;
      }

      .ft-btn-primary:hover:not(:disabled) {
        background: #D14E33;
      }

      .ft-btn-primary:disabled,
      .ft-btn-ghost:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .ft-btn-ghost {
        border: 1px solid #E5E7EB;
        background: #fff;
        color: #4B5563;
        border-radius: 12px;
        padding: 11px 18px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
      }

      .ft-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .ft-kpi-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .ft-kpi-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .ft-kpi-delta {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 999px;
      }

      .ft-kpi-delta.up {
        background: #ECFDF5;
        color: #059669;
      }

      .ft-kpi-delta.down {
        background: #FEF2F2;
        color: #DC2626;
      }

      .ft-kpi-value {
        margin-top: 14px;
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: -0.03em;
      }

      .ft-kpi-hint {
        margin-top: 6px;
        font-size: 0.75rem;
        color: #9CA3AF;
      }

      .ft-chart {
        margin-top: 0;
      }

      .ft-chart-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 18px;
      }

      .ft-chart-body {
        position: relative;
        height: 240px;
        border-radius: 18px;
        background: linear-gradient(180deg, #FDF0EC 0%, #F7F7F7 100%);
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        padding: 24px 20px 16px;
      }

      .ft-chart-bars {
        display: flex;
        align-items: flex-end;
        gap: 10px;
        width: 100%;
        height: 100%;
      }

      .ft-bar {
        flex: 1;
        border-radius: 8px 8px 4px 4px;
        background: linear-gradient(180deg, #F07A61, #E85D3F);
        opacity: 0.85;
        min-height: 12%;
      }

      .ft-chart-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }

      .ft-chart-overlay span {
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid #F3F4F6;
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #6B7280;
        box-shadow: 0 4px 12px rgba(17, 17, 17, 0.06);
      }

      .ft-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 18px;
      }

      .ft-search {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #F7F7F7;
        border: 1px solid #E5E7EB;
        border-radius: 12px;
        padding: 10px 14px;
        min-width: min(280px, 100%);
        color: #9CA3AF;
      }

      .ft-search input {
        border: none;
        background: transparent;
        outline: none;
        width: 100%;
        font: inherit;
        color: #111111;
      }

      .ft-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .ft-pill {
        border: 1px solid #E5E7EB;
        background: #fff;
        color: #6B7280;
        border-radius: 999px;
        padding: 7px 12px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
      }

      .ft-pill.active {
        background: #FDF0EC;
        border-color: #F4B8A8;
        color: #E85D3F;
      }

      .ft-table-scroll {
        overflow-x: auto;
      }

      .ft-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 720px;
      }

      .ft-table th {
        text-align: left;
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #9CA3AF;
        font-weight: 700;
        padding: 0 12px 12px;
        border-bottom: 1px solid #F3F4F6;
      }

      .ft-table td {
        padding: 14px 12px;
        border-bottom: 1px solid #F3F4F6;
        font-size: 0.875rem;
        vertical-align: middle;
      }

      .ft-table tbody tr:hover {
        background: #FDF0EC;
      }

      .ft-table tbody tr.clickable {
        cursor: pointer;
      }

      .mono {
        font-variant-numeric: tabular-nums;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.8125rem;
      }

      .mono a {
        color: #E85D3F;
        font-weight: 600;
        text-decoration: none;
      }

      .mono a:hover {
        text-decoration: underline;
      }

      .strong {
        font-weight: 600;
        color: #111111;
      }

      .muted {
        color: #9CA3AF;
      }

      .ft-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: capitalize;
        letter-spacing: 0.02em;
      }

      .ft-badge[data-status='active'] {
        background: #ECFDF5;
        color: #059669;
      }

      .ft-badge[data-status='pending'] {
        background: #FFFBEB;
        color: #D97706;
      }

      .ft-badge[data-status='closed'] {
        background: #F3F4F6;
        color: #6B7280;
      }

      .ft-badge[data-status='failed'] {
        background: #FEF2F2;
        color: #DC2626;
      }

      .ft-pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 18px;
        padding-top: 4px;
      }

      .ft-page-btns {
        display: flex;
        gap: 6px;
      }

      .ft-page-btn {
        min-width: 36px;
        height: 36px;
        border-radius: 10px;
        border: 1px solid #E5E7EB;
        background: #fff;
        color: #4B5563;
        font-weight: 600;
        font-size: 0.8125rem;
        cursor: pointer;
        padding: 0 10px;
      }

      .ft-page-btn.active {
        background: #E85D3F;
        border-color: #E85D3F;
        color: #fff;
      }

      .ft-page-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .ft-docs-grid {
        display: grid;
        grid-template-columns: 1fr 1.1fr;
        gap: 16px;
      }

      .ft-dropzone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 10px;
        min-height: 280px;
        border: 1.5px dashed #F4B8A8;
        background: linear-gradient(180deg, #FDF0EC 0%, #ffffff 70%);
      }

      .ft-drop-icon {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: #fff;
        color: #E85D3F;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 20px rgba(232, 93, 63, 0.15);
        margin-bottom: 4px;
      }

      .ft-doc-list {
        list-style: none;
        margin: 18px 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .ft-doc-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 14px;
        background: #F7F7F7;
      }

      .ft-doc-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: #111111;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.625rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        flex-shrink: 0;
      }

      .ft-doc-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        flex: 1;
      }

      .ft-link-btn {
        border: none;
        background: transparent;
        color: #E85D3F;
        font-weight: 700;
        font-size: 0.8125rem;
        cursor: pointer;
      }

      .ft-form-card {
        max-width: 640px;
      }

      .ft-form {
        margin-top: 22px;
        display: grid;
        gap: 16px;
      }

      .ft-float {
        position: relative;
        display: block;
      }

      .ft-float input,
      .ft-float select,
      .ft-float textarea {
        width: 100%;
        border: 1px solid #E5E7EB;
        border-radius: 14px;
        background: #F7F7F7;
        padding: 22px 14px 10px;
        font: inherit;
        color: #111111;
        outline: none;
      }

      .ft-float span {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.875rem;
        color: #9CA3AF;
        pointer-events: none;
        transition: 0.15s ease;
      }

      .ft-float-area span {
        top: 18px;
        transform: none;
      }

      .ft-float input:not(:placeholder-shown) + span,
      .ft-float textarea:not(:placeholder-shown) + span,
      .ft-float select + span {
        top: 8px;
        transform: none;
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: #E85D3F;
      }

      .ft-form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 8px;
      }

      .ft-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 10px;
        padding: 64px 24px;
      }

      .ft-empty-icon {
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: #FDF0EC;
        color: #E85D3F;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
      }

      @media (max-width: 960px) {
        .ft-kpi-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .ft-docs-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .ft-kpi-grid {
          grid-template-columns: 1fr;
        }

        .ft-title {
          font-size: 1.375rem;
        }
      }
    `,
  ],
})
export class FintechShellComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private routeData = toSignal(
    this.route.data.pipe(
      map(
        (d): ShellData => ({
          title: (d['title'] as string) || 'Page',
          subtitle: (d['subtitle'] as string) || '',
          section: (d['section'] as string) || 'App',
          kind: (d['kind'] as FintechShellKind) || 'empty',
        }),
      ),
    ),
    {
      initialValue: {
        title: 'Page',
        subtitle: '',
        section: 'App',
        kind: 'empty' as FintechShellKind,
      },
    },
  );

  data = computed(() => this.routeData());

  readonly filters = ['All', 'Active', 'Pending', 'Closed'];

  readonly kpis = [
    { label: 'Total volume', value: '₹48.2L', delta: '+12.4%', up: true, hint: 'vs last month' },
    { label: 'Active loans', value: '1,284', delta: '+3.1%', up: true, hint: 'portfolio count' },
    { label: 'EMI collected', value: '₹9.6L', delta: '-1.8%', up: false, hint: 'this cycle' },
    { label: 'Default rate', value: '1.4%', delta: '-0.3%', up: true, hint: '30-day rolling' },
  ];

  readonly chartHeights = [42, 58, 46, 72, 64, 80, 55, 88, 70, 62, 90, 74];

  readonly tableRows: MockRow[] = [
    { id: 'LN-1042', name: 'Priya Sharma', meta: 'Personal loan · 36 mo', amount: '₹2,50,000', status: 'active', date: '28 Jul 2026' },
    { id: 'LN-1041', name: 'James Carter', meta: 'Business loan · 48 mo', amount: '₹8,00,000', status: 'pending', date: '27 Jul 2026' },
    { id: 'LN-1038', name: 'Aisha Khan', meta: 'Home loan · 180 mo', amount: '₹42,00,000', status: 'active', date: '25 Jul 2026' },
    { id: 'LN-1035', name: 'Diego Ruiz', meta: 'Auto loan · 60 mo', amount: '₹6,40,000', status: 'closed', date: '22 Jul 2026' },
    { id: 'LN-1031', name: 'Mei Lin', meta: 'Personal loan · 24 mo', amount: '₹1,20,000', status: 'failed', date: '20 Jul 2026' },
    { id: 'LN-1029', name: 'Omar Hassan', meta: 'Education · 48 mo', amount: '₹3,75,000', status: 'active', date: '18 Jul 2026' },
    { id: 'LN-1024', name: 'Sofia Rossi', meta: 'Business loan · 36 mo', amount: '₹12,00,000', status: 'pending', date: '15 Jul 2026' },
    { id: 'LN-1018', name: 'Noah Patel', meta: 'Personal loan · 18 mo', amount: '₹90,000', status: 'closed', date: '12 Jul 2026' },
  ];

  readonly documents: MockDoc[] = [
    { name: 'KYC_Aadhaar_Priya.pdf', size: '1.2 MB', type: 'PDF', updated: '2h ago' },
    { name: 'Income_Proof_Q2.png', size: '840 KB', type: 'PNG', updated: 'Yesterday' },
    { name: 'Loan_Agreement_1042.pdf', size: '2.4 MB', type: 'PDF', updated: '3 days ago' },
    { name: 'Bank_Statement_Jun.pdf', size: '3.1 MB', type: 'PDF', updated: '1 week ago' },
  ];

  onRowClick(row: MockRow) {
    if (this.data().title === 'Loan Applications') {
      this.router.navigate(['/loans', row.id]);
    }
  }
}
