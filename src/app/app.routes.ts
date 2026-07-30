import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

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
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    // canActivate: [authGuard],
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
    ],
  },
  { path: '**', redirectTo: '' },
];
