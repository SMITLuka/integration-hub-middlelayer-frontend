import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../auth/auth.service';
import { AccessLevel, ProfileService } from '../../auth/profile.service';

/**
 * Persistent full-height left sidebar, structurally modeled on DICM's own
 * sidebar+content layout (colors follow SMIT's own purple identity, not DICM's):
 * navigation, the signed-in user's profile with their rights per level, and logout.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly profile = inject(ProfileService);

  protected readonly levelLabels: Record<AccessLevel, string> = {
    MANDATORS_COMPANIES: 'Mandators & Companies',
    INTERFACES_TEMPLATES: 'Interfaces & Templates',
    CONFIGURATIONS_MAPPINGS: 'Configurations & Mappings',
  };
}
