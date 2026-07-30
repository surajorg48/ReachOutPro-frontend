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
    title: 'Dashboard',
    description: 'Outreach performance and activity overview',
  },
  '/companies': {
    section: 'Main',
    title: 'Companies',
    description: 'Manage companies, contacts, and outreach status',
  },
  '/discover': {
    section: 'Main',
    title: 'Discover',
    description: 'Find companies by industry and location',
  },
  '/scraper': {
    section: 'Main',
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
  '/resume': {
    section: 'Tools',
    title: 'Resume Analyzer',
    description: 'Parse resumes and generate email templates',
  },
  '/settings': {
    section: 'Tools',
    title: 'Settings',
    description: 'Profile, Gmail accounts, and preferences',
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

  onLogout() {
    this.closeMenus();
    this.authService.logout().subscribe();
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
      title: 'Dashboard',
      description: 'Outreach performance and activity overview',
    };
  }
}
