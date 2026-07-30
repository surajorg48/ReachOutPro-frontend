import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  templateUrl: './page-header.html',
  styleUrls: ['./page-header.scss'],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
