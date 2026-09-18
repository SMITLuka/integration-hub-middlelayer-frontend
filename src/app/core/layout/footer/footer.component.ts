import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Application footer showing the SMIT logo, a copyright line and a link
 * back to the SMIT corporate site.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  /** Current year, used in the copyright line. */
  protected readonly year = new Date().getFullYear();
}
