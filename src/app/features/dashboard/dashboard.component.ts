import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary } from '../../core/models/dashboard-summary.model';
import { ProfileService } from '../../core/auth/profile.service';

/**
 * Landing dashboard: summary cards for Interfaces, Mandators and Mapping
 * Templates, plus quick-action shortcuts.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly profile = inject(ProfileService);
  private readonly dashboardService = inject(DashboardService);

  protected readonly summary = signal<DashboardSummary | null>(null);

  constructor() {
    this.dashboardService.getSummary().subscribe((summary) => this.summary.set(summary));
  }
}
