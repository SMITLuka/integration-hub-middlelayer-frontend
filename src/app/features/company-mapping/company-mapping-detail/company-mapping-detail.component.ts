import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CompanyService } from '../../../core/services/company.service';
import { CompanyMappingService } from '../../../core/services/company-mapping.service';
import { CompanyMappingDetail, ResolvedMappingRow } from '../../../core/models/company-mapping.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ValuePromptDialogComponent } from '../../../shared/components/key-value-editor/value-prompt-dialog.component';

/**
 * Company Mapping detail screen: shows one Company's instance of an Interface's Mapping
 * Template, resolved section by section. Each row is either inherited from the Template
 * (edit-pencil, "From Template" caption) or explicitly overridden on this Company Mapping
 * (red delete-trash, no caption) - the 2-level cascade resolved by the backend.
 */
@Component({
  selector: 'app-company-mapping-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './company-mapping-detail.component.html',
  styleUrl: './company-mapping-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyMappingDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);
  private readonly companyMappingService = inject(CompanyMappingService);
  private readonly dialog = inject(MatDialog);

  protected readonly companyId = Number(this.route.snapshot.paramMap.get('companyId'));
  protected readonly mappingId = Number(this.route.snapshot.paramMap.get('mappingId'));
  protected readonly detail = signal<CompanyMappingDetail | null>(null);
  protected readonly companyName = signal('');

  constructor() {
    this.companyService.getDetail(this.companyId).subscribe((company) => this.companyName.set(company.name));
    this.reload();
  }

  private reload(): void {
    this.companyMappingService.getDetail(this.companyId, this.mappingId).subscribe((detail) => this.detail.set(detail));
  }

  onEditRow(row: ResolvedMappingRow): void {
    const ref = this.dialog.open(ValuePromptDialogComponent, {
      width: '360px',
      data: { title: `Edit ${row.descriptor}`, value: row.effectiveValue ?? '' },
    });
    ref.afterClosed().subscribe((value) => {
      if (value !== undefined && value !== null) {
        this.companyMappingService
          .setRowOverride(this.companyId, this.mappingId, row.templateRowId, value)
          .subscribe(() => this.reload());
      }
    });
  }

  onDeleteRow(row: ResolvedMappingRow): void {
    this.companyMappingService.deleteRowOverride(this.companyId, this.mappingId, row.templateRowId).subscribe(() => this.reload());
  }

  onDeleteMapping(): void {
    const detail = this.detail();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Mapping', message: `Delete the mapping for "${detail?.interfaceName}"? This cannot be undone.` },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.companyMappingService.delete(this.companyId, this.mappingId).subscribe(() => this.router.navigate(['/companies', this.companyId]));
      }
    });
  }
}
