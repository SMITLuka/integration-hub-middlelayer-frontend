import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './core/auth/auth.service';
import { ProfileService } from './core/auth/profile.service';
import { environment } from '../environments/environment';
import { ShellComponent } from './core/layout/shell/shell.component';

/**
 * Application root. All actual page content renders inside the shell's
 * own router-outlet. A rejected SSO login, or a user without Integration Hub
 * rights in SSO, is shown instead of the shell, with a manual way back to the
 * portal rather than an automatic redirect.
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
  protected readonly profile = inject(ProfileService);
  protected readonly ssoUrl = `${environment.ssoUrl}/`;
}
