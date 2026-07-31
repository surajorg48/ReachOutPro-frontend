import { Component, inject, signal, computed, HostListener, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

interface PageMeta {
  section: string;
  title: string;
  description: string;
}

const PAGE_META: Record<string, PageMeta> = {
  '/': {
    section: 'Main',
    title: 'Financial Dashboard',
    description: 'Portfolio performance and activity overview',
  },
  '/leads': {
    section: 'CRM',
    title: 'Leads',
    description: 'Track and qualify inbound sales prospects',
  },
  '/customers': {
    section: 'CRM',
    title: 'Customers',
    description: 'Manage customer profiles and relationship status',
  },
  '/companies': {
    section: 'CRM',
    title: 'Companies',
    description: 'Manage companies, contacts, and outreach status',
  },
  '/loans': {
    section: 'Lending',
    title: 'Loan Applications',
    description: 'Review applications across personal, business, and home loans',
  },
  '/emi': {
    section: 'Lending',
    title: 'EMI Schedule',
    description: 'Upcoming installments and collection status',
  },
  '/payments': {
    section: 'Lending',
    title: 'Payments',
    description: 'Settlements, refunds, and payment attempts',
  },
  '/discover': {
    section: 'Outreach',
    title: 'Discover',
    description: 'Find companies by industry and location',
  },
  '/scraper': {
    section: 'Outreach',
    title: 'Scraper',
    description: 'Extract HR emails from company websites',
  },
  '/campaigns': {
    section: 'Outreach',
    title: 'Campaigns',
    description: 'Create and manage email campaigns',
  },
  '/campaigns/new': {
    section: 'Outreach',
    title: 'New Campaign',
    description: 'Compose a new outreach campaign',
  },
  '/email-log': {
    section: 'Outreach',
    title: 'Email Logs',
    description: 'Full history of email send attempts',
  },
  '/analytics': {
    section: 'Insights',
    title: 'Analytics',
    description: 'Conversion, delinquency, and channel trends',
  },
  '/reports': {
    section: 'Insights',
    title: 'Reports',
    description: 'Portfolio health and collection performance',
  },
  '/documents': {
    section: 'Insights',
    title: 'Documents',
    description: 'KYC packs, agreements, and supporting files',
  },
  '/resume': {
    section: 'Tools',
    title: 'Resume Analyzer',
    description: 'Parse resumes and generate email templates',
  },
  '/users': {
    section: 'Admin',
    title: 'User Management',
    description: 'Team members with access to the workspace',
  },
  '/roles': {
    section: 'Admin',
    title: 'Roles & Permissions',
    description: 'Permission sets for lending and CRM workflows',
  },
  '/notifications': {
    section: 'Account',
    title: 'Notifications',
    description: 'Alerts for EMI, approvals, and campaign events',
  },
  '/profile': {
    section: 'Account',
    title: 'Profile',
    description: 'Your personal account details',
  },
  '/settings': {
    section: 'Account',
    title: 'Settings',
    description: 'Profile, Gmail accounts, and preferences',
  },
  '/subscription': {
    section: 'Account',
    title: 'Subscription',
    description: 'Plan, billing, and usage limits',
  },
  '/wallet': {
    section: 'Account',
    title: 'Wallet',
    description: 'Credits, payouts, and balance overview',
  },
  '/referral': {
    section: 'Account',
    title: 'Referral',
    description: 'Invite partners and earn rewards',
  },
  '/help': {
    section: 'Account',
    title: 'Help Center',
    description: 'Guides and support for ReachOut Pro',
  },
  '/admin/plans': {
    section: 'Admin',
    title: 'Admin Plans',
    description: 'Manage subscription plan catalog',
  },
  '/error-demo/500': {
    section: 'System',
    title: 'Server Error',
    description: 'Demo 500 error page',
  },
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  showMenu = signal(false);
  mobileNavOpen = signal(false);
  searchFocused = signal(false);
  currentUrl = signal('/');
  darkMode = signal(false);

  user = this.authService.user;

  page = computed(() => this.resolvePage(this.currentUrl()));

  organizationLabel = computed(() => {
    const u = this.user();
    if (!u) return 'Workspace';
    const role = (u.role || '').replace(/_/g, ' ');
    if (role) {
      return role.replace(/\b\w/g, (c) => c.toUpperCase()) + ' Workspace';
    }
    return 'Workspace';
  });

  ngOnInit() {
    this.currentUrl.set(this.normalizeUrl(this.router.url));
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        this.currentUrl.set(this.normalizeUrl(e.urlAfterRedirects));
        this.closeMenus();
      });
  }

  userInitials(): string {
    const u = this.authService.user();
    if (!u?.fullName) return '??';
    return u.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  closeMenus() {
    this.showMenu.set(false);
    this.mobileNavOpen.set(false);
  }

  isAdmin(): boolean {
    return this.authService.hasRole('admin');
  }

  onLogout() {
    this.closeMenus();
    this.authService.logout().subscribe();
  }

  toggleTheme() {
    const next = !this.darkMode();
    this.darkMode.set(next);
    document.documentElement.classList.toggle('theme-dark', next);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.app-header__user')) {
      this.showMenu.set(false);
    }
    if (!target.closest('.app-header')) {
      this.mobileNavOpen.set(false);
    }
  }

  private normalizeUrl(url: string): string {
    const path = url.split('?')[0].split('#')[0];
    if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
    return path || '/';
  }

  private resolvePage(url: string): PageMeta {
    if (PAGE_META[url]) return PAGE_META[url];
    if (url.startsWith('/loans/')) {
      return {
        section: 'Lending',
        title: 'Loan Details',
        description: 'Application summary, terms, and borrower profile',
      };
    }
    if (url.startsWith('/campaigns/') && url.endsWith('/edit')) {
      return {
        section: 'Outreach',
        title: 'Edit Campaign',
        description: 'Update campaign template and settings',
      };
    }
    if (url.startsWith('/campaigns')) {
      return PAGE_META['/campaigns'];
    }
    return {
      section: 'Main',
      title: 'Financial Dashboard',
      description: 'Portfolio performance and activity overview',
    };
  }
}
