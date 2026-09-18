import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InterfaceService } from '../../../core/services/interface.service';
import { InterfaceDetail, InterfaceUsage } from '../../../core/models/interface.model';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { KeyValueChange, KeyValueEditorComponent, KeyValueRow } from '../../../shared/components/key-value-editor/key-value-editor.component';

/**
 * Interface detail screen: read-only endpoint fields, its own (non-inherited)
 * Additional Data, and the Mandator/Company pairs currently using its Mapping
 * and Configuration Templates.
 */
@Component({
  selector: 'app-interface-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, DataTableComponent, KeyValueEditorComponent],
  templateUrl: './interface-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interfaceService = inject(InterfaceService);

  protected readonly interfaceId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly detail = signal<InterfaceDetail | null>(null);
  protected readonly additionalData = signal<KeyValueRow[]>([]);

  protected readonly usageColumns: DataTableColumn<InterfaceUsage>[] = [
    { key: 'mandatorName', label: 'Mandator Name' },
    { key: 'companyName', label: 'Company Name' },
    { key: 'updatedAt', label: 'Updated At', value: (row) => new Date(row.updatedAt).toLocaleString() },
  ];

  constructor() {
    this.load();
  }

  private load(): void {
    this.interfaceService.getDetail(this.interfaceId).subscribe((detail) => {
      this.detail.set(detail);
      this.additionalData.set(detail.additionalData.map((entry) => ({ key: entry.key, value: entry.value })));
    });
  }

  onAdditionalDataAdd(change: KeyValueChange): void {
    this.interfaceService.setAdditionalData(this.interfaceId, change.key, change.value).subscribe(() => this.reloadAdditionalData());
  }

  onAdditionalDataDelete(key: string): void {
    this.interfaceService.deleteAdditionalData(this.interfaceId, key).subscribe(() => this.reloadAdditionalData());
  }

  private reloadAdditionalData(): void {
    this.interfaceService
      .getAdditionalData(this.interfaceId)
      .subscribe((list) => this.additionalData.set(list.map((entry) => ({ key: entry.key, value: entry.value }))));
  }

  onUsageRowClick(row: InterfaceUsage): void {
    this.router.navigate(['/companies', row.companyId]);
  }
}
