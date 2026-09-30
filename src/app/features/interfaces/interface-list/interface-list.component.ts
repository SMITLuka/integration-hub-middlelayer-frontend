import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InterfaceService } from '../../../core/services/interface.service';
import { InterfaceSummary } from '../../../core/models/interface.model';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ActionMenuComponent, ActionMenuItem } from '../../../shared/components/action-menu/action-menu.component';
import { ProfileService } from '../../../core/auth/profile.service';

/** Interfaces list screen: searchable, paginated table with row-level actions. */
@Component({
  selector: 'app-interface-list',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, DataTableComponent, ActionMenuComponent],
  templateUrl: './interface-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceListComponent {
  protected readonly profile = inject(ProfileService);
  private readonly interfaceService = inject(InterfaceService);
  private readonly router = inject(Router);

  protected readonly columns: DataTableColumn<InterfaceSummary>[] = [
    { key: 'name', label: 'Name' },
    { key: 'hasMappingTemplate', label: 'Mapping Template', value: (row) => (row.hasMappingTemplate ? '✓' : '—') },
    { key: 'hasConfigurationTemplate', label: 'Configuration Template', value: (row) => (row.hasConfigurationTemplate ? '✓' : '—') },
  ];

  protected readonly rows = signal<InterfaceSummary[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(20);

  private searchTerm = '';

  constructor() {
    this.load();
  }

  private load(): void {
    this.interfaceService.list(this.searchTerm, this.pageIndex(), this.pageSize()).subscribe((page) => {
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

  onRowClick(row: InterfaceSummary): void {
    this.router.navigate(['/interfaces', row.id]);
  }

  buildActions(row: InterfaceSummary): ActionMenuItem[] {
    return [
      { label: 'View Details', action: () => this.router.navigate(['/interfaces', row.id]) },
      ...(this.profile.can('INTERFACES_TEMPLATES', 'write')
        ? [{ label: 'Edit', action: () => this.router.navigate(['/interfaces', row.id, 'edit']) }]
        : []),
      { label: 'Mapping Template', action: () => this.router.navigate(['/interfaces', row.id, 'mapping-template']) },
      { label: 'Configuration Template', action: () => this.router.navigate(['/interfaces', row.id, 'configuration-template']) },
    ];
  }
}
