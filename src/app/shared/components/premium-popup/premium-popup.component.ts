import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PremiumPopupService } from '../../../core/services/subscription.service';

@Component({
  selector: 'app-premium-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './premium-popup.component.html',
  styleUrls: ['./premium-popup.component.scss'],
})
export class PremiumPopupComponent {
  popup = inject(PremiumPopupService);
  private router = inject(Router);

  upgrade(): void {
    this.popup.hide();
    this.router.navigate(['/subscription']);
  }
}
