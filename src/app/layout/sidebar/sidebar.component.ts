import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  private settingsApi = inject(SettingsService);
  private authService = inject(AuthService);
  gmailConnected = signal(false);
  collapsed = signal(false);

  isAdmin(): boolean {
    return this.authService.hasRole('admin');
  }

  constructor() {
    this.settingsApi.get().subscribe({
      next: (r: any) => this.gmailConnected.set(!!r.gmailConnected),
      error: () => {}
    });
  }
}
