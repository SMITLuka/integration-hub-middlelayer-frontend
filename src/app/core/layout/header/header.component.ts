import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Sticky application header showing the SMIT logo, the application title
 * and a link back to the SMIT corporate site.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}
