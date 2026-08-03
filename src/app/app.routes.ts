import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

const fintechShell = () =>
  import('./features/fintech/fintech-shell.component').then(m => m.FintechShellComponent);

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    // canActivate: [authGuard],
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'campaigns',
        loadComponent: () =>
          import('./features/campaigns/campaigns.component').then(m => m.CampaignsComponent),
      },
      {
        path: 'campaigns/new',
        loadComponent: () =>
          import('./features/campaign-compose/campaign-compose.component').then(
            m => m.CampaignComposeComponent,
          ),
      },
      {
        path: 'campaigns/:id/edit',
        loadComponent: () =>
          import('./features/campaign-compose/campaign-compose.component').then(
            m => m.CampaignComposeComponent,
          ),
      },
      {
        path: 'email-log',
        loadComponent: () =>
          import('./features/email-log/email-log.component').then(m => m.EmailLogComponent),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./features/companies/companies.component').then(m => m.CompaniesComponent),
      },
      {
        path: 'discover',
        loadComponent: () =>
          import('./features/discover/discover.component').then(m => m.DiscoverComponent),
      },
      {
        path: 'scraper',
        loadComponent: () =>
          import('./features/scraper/scraper.component').then(m => m.ScraperComponent),
      },
      {
        path: 'resume',
        loadComponent: () =>
          import('./features/resume-analyzer/resume-analyzer.component').then(
            m => m.ResumeAnalyzerComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'subscription',
        loadComponent: () =>
          import('./features/subscription/subscription.component').then(m => m.SubscriptionComponent),
      },
      {
        path: 'admin/plans',
        loadComponent: () =>
          import('./features/admin/admin-plans.component').then(m => m.AdminPlansComponent),
      },
      {
        path: 'admin/coupons',
        loadComponent: () =>
          import('./features/admin/admin-coupons.component').then(m => m.AdminCouponsComponent),
      },

      // FinTech UI shells
      {
        path: 'leads',
        loadComponent: fintechShell,
        data: {
          title: 'Leads',
          subtitle: 'Track and qualify inbound sales prospects.',
          section: 'Sales',
          kind: 'table',
        },
      },
      {
        path: 'customers',
        loadComponent: fintechShell,
        data: {
          title: 'Customers',
          subtitle: 'Manage customer profiles and relationship status.',
          section: 'CRM',
          kind: 'table',
        },
      },
      {
        path: 'loans',
        loadComponent: fintechShell,
        data: {
          title: 'Loan Applications',
          subtitle: 'Review applications across personal, business, and home loans.',
          section: 'Lending',
          kind: 'table',
        },
      },
      {
        path: 'loans/:id',
        loadComponent: fintechShell,
        data: {
          title: 'Loan Details',
          subtitle: 'Application summary, terms, and borrower profile.',
          section: 'Lending',
          kind: 'settings',
        },
      },
      {
        path: 'emi',
        loadComponent: fintechShell,
        data: {
          title: 'EMI Schedule',
          subtitle: 'Upcoming installments and collection status.',
          section: 'Lending',
          kind: 'table',
        },
      },
      {
        path: 'payments',
        loadComponent: fintechShell,
        data: {
          title: 'Payments',
          subtitle: 'Settlements, refunds, and payment attempts.',
          section: 'Lending',
          kind: 'table',
        },
      },
      {
        path: 'reports',
        loadComponent: fintechShell,
        data: {
          title: 'Reports',
          subtitle: 'Portfolio health and collection performance.',
          section: 'Insights',
          kind: 'kpis',
        },
      },
      {
        path: 'analytics',
        loadComponent: fintechShell,
        data: {
          title: 'Analytics',
          subtitle: 'Conversion, delinquency, and channel trends.',
          section: 'Insights',
          kind: 'kpis',
        },
      },
      {
        path: 'documents',
        loadComponent: fintechShell,
        data: {
          title: 'Documents',
          subtitle: 'KYC packs, agreements, and supporting files.',
          section: 'Insights',
          kind: 'docs',
        },
      },
      {
        path: 'users',
        loadComponent: fintechShell,
        data: {
          title: 'Users',
          subtitle: 'Team members with access to the workspace.',
          section: 'Admin',
          kind: 'table',
        },
      },
      {
        path: 'roles',
        loadComponent: fintechShell,
        data: {
          title: 'Roles',
          subtitle: 'Permission sets for lending and CRM workflows.',
          section: 'Admin',
          kind: 'table',
        },
      },
      {
        path: 'notifications',
        loadComponent: fintechShell,
        data: {
          title: 'Notifications',
          subtitle: 'Alerts for EMI, approvals, and campaign events.',
          section: 'Account',
          kind: 'table',
        },
      },
      {
        path: 'profile',
        loadComponent: fintechShell,
        data: {
          title: 'Profile',
          subtitle: 'Your personal account details.',
          section: 'Account',
          kind: 'settings',
        },
      },
      {
        path: 'wallet',
        loadComponent: fintechShell,
        data: {
          title: 'Wallet',
          subtitle: 'Credits, payouts, and balance overview.',
          section: 'Account',
          kind: 'kpis',
        },
      },
      {
        path: 'referral',
        loadComponent: fintechShell,
        data: {
          title: 'Referral',
          subtitle: 'Invite partners and earn rewards.',
          section: 'Account',
          kind: 'empty',
        },
      },
      {
        path: 'help',
        loadComponent: fintechShell,
        data: {
          title: 'Help Center',
          subtitle: 'Guides and support for ReachOut Pro.',
          section: 'Account',
          kind: 'empty',
        },
      },
      {
        path: 'error-demo/500',
        loadComponent: () =>
          import('./features/errors/server-error.component').then(m => m.ServerErrorComponent),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/errors/not-found.component').then(m => m.NotFoundComponent),
  },
];
