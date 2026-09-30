import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MandatorService } from '../../../core/services/mandator.service';
import { MandatorSummary } from '../../../core/models/mandator.model';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ActionMenuComponent, ActionMenuItem } from '../../../shared/components/action-menu/action-menu.component';
import { ProfileService } from '../../../core/auth/profile.service';

/** Mandators list screen: searchable, paginated table with row-level actions. */
@Component({
  selector: 'app-mandator-list',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, DataTableComponent, ActionMenuComponent],
  templateUrl: './mandator-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MandatorListComponent {
  protected readonly profile = inject(ProfileService);
  private readonly mandatorService = inject(MandatorService);
  private readonly router = inject(Router);

  protected readonly columns: DataTableColumn<MandatorSummary>[] = [
    { key: 'name', label: 'Name' },
    { key: 'externalMandatorId', label: 'DMS ID' },
    { key: 'system', label: 'System' },
    { key: 'country', label: 'Country' },
  ];

  protected readonly rows = signal<MandatorSummary[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(20);

  private searchTerm = '';

  constructor() {
    this.load();
  }

  private load(): void {
    this.mandatorService.list(this.searchTerm, this.pageIndex(), this.pageSize()).subscribe((page) => {
      this.rows.set(page.content);
      this.totalElements.set(page.totalElements);
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.pageIndex.set(0);
    this.load();
  }

  onPageIndexChange(index: number): void {
    this.pageIndex.set(index);
    this.load();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(0);
    this.load();
  }

  onRowClick(row: MandatorSummary): void {
    this.router.navigate(['/mandators', row.id]);
  }

  buildActions(row: MandatorSummary): ActionMenuItem[] {
    return [
      { label: 'View Details', action: () => this.router.navigate(['/mandators', row.id]) },
      ...(this.profile.can('MANDATORS_COMPANIES', 'write')
        ? [{ label: 'Edit', action: () => this.router.navigate(['/mandators', row.id, 'edit']) }]
        : []),
    ];
  }
}
