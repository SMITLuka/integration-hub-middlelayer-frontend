import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MandatorService } from '../../../core/services/mandator.service';
import { MandatorDetail } from '../../../core/models/mandator.model';
import { CompanySummary } from '../../../core/models/company.model';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { KeyValueChange, KeyValueEditorComponent, KeyValueRow } from '../../../shared/components/key-value-editor/key-value-editor.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProfileService } from '../../../core/auth/profile.service';

/**
 * Mandator detail screen: read-only fields, inline-editable Additional Data,
 * and the Mandator's Companies table.
 */
@Component({
  selector: 'app-mandator-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, DataTableComponent, KeyValueEditorComponent],
  templateUrl: './mandator-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MandatorDetailComponent {
  protected readonly profile = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mandatorService = inject(MandatorService);
  private readonly dialog = inject(MatDialog);

  protected readonly mandatorId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly detail = signal<MandatorDetail | null>(null);
  protected readonly additionalData = signal<KeyValueRow[]>([]);

  protected readonly companyColumns: DataTableColumn<CompanySummary>[] = [
    { key: 'name', label: 'Name' },
    { key: 'dmsCompanyId', label: 'Company ID' },
    { key: 'location', label: 'Location' },
    { key: 'countryCode', label: 'Country' },
  ];

  constructor() {
    this.load();
  }

  private load(): void {
    this.mandatorService.getDetail(this.mandatorId).subscribe((detail) => {
      this.detail.set(detail);
      this.additionalData.set(detail.additionalData.map((entry) => ({ key: entry.key, value: entry.value })));
    });
  }

  onAdditionalDataAdd(change: KeyValueChange): void {
    this.mandatorService.setAdditionalData(this.mandatorId, change.key, change.value).subscribe(() => this.reloadAdditionalData());
  }

  onAdditionalDataDelete(key: string): void {
    this.mandatorService.deleteAdditionalData(this.mandatorId, key).subscribe(() => this.reloadAdditionalData());
  }

  private reloadAdditionalData(): void {
    this.mandatorService
      .getAdditionalData(this.mandatorId)
      .subscribe((list) => this.additionalData.set(list.map((entry) => ({ key: entry.key, value: entry.value }))));
  }

  onCompanyRowClick(row: CompanySummary): void {
    this.router.navigate(['/companies', row.id]);
  }

  onDeleteMandator(): void {
    const name = this.detail()?.name ?? '';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Mandator', message: `Delete mandator "${name}"? This cannot be undone.` },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.mandatorService.delete(this.mandatorId).subscribe(() => this.router.navigate(['/mandators']));
      }
    });
  }
}
