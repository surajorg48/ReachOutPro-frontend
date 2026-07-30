import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './status-badge.html',
  styleUrls: ['./status-badge.scss'],
})
export class StatusBadgeComponent {
  @Input() status = 'pending';
  @Input() label = '';
}
