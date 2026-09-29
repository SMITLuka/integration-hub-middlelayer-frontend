import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './core/auth/auth.service';
import { ShellComponent } from './core/layout/shell/shell.component';

/**
 * Application root. All actual page content renders inside the shell's
 * own router-outlet. A failed Bitrix login, or a logout, is shown instead of
 * the shell, with a manual login button rather than an automatic redirect.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
}
