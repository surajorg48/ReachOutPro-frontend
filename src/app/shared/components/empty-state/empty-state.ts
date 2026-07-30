import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
  styleUrls: ['./empty-state.scss'],
})
export class EmptyStateComponent {
  @Input() title = 'No data';
  @Input() message = '';
  @Input() padding = '60px 20px';
}
