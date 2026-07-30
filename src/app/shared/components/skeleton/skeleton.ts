import { Component, Input, numberAttribute } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-skeleton-line',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './skeleton-line.html',
  styleUrls: ['./skeleton-line.scss'],
})
export class SkeletonLineComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() style: Record<string, string> = {};
}

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './skeleton-card.html',
  styleUrls: ['./skeleton-card.scss'],
})
export class SkeletonCardComponent {
  @Input({ transform: numberAttribute }) height = 100;
  @Input() style: Record<string, string> = {};
}

@Component({
  selector: 'app-skeleton-stat-card',
  standalone: true,
  imports: [SkeletonLineComponent],
  templateUrl: './skeleton-stat-card.html',
  styleUrls: ['./skeleton-stat-card.scss'],
})
export class SkeletonStatCardComponent {}

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [SkeletonLineComponent],
  templateUrl: './skeleton-table.html',
  styleUrls: ['./skeleton-table.scss'],
})
export class SkeletonTableComponent {
  @Input({ transform: numberAttribute }) rows = 6;
  @Input({ transform: numberAttribute }) cols = 6;
  get rowsArr(): number[] { return Array.from({ length: this.rows }, (_, i) => i); }
  get colsArr(): number[] { return Array.from({ length: this.cols }, (_, i) => i); }
}
