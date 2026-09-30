import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CompanyService } from '../../../core/services/company.service';
import { CompanyMappingService } from '../../../core/services/company-mapping.service';
import { CompanyConfigurationService } from '../../../core/services/company-configuration.service';
import { InterfaceService } from '../../../core/services/interface.service';
import { CompanyDetail, CompanyMappingSummary, CompanyConfigurationSummary } from '../../../core/models/company.model';
import { InterfaceSummary } from '../../../core/models/interface.model';
import { KeyValueChange, KeyValueEditorComponent, KeyValueRow } from '../../../shared/components/key-value-editor/key-value-editor.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ActionMenuComponent, ActionMenuItem } from '../../../shared/components/action-menu/action-menu.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ProfileService } from '../../../core/auth/profile.service';

/**
 * Company detail screen: read-only fields, resolved Additional Data (own overrides vs.
 * inherited Mandator values), and the Company's Mappings and Configurations - each with
 * a "+ New" picker limited to Interfaces that define the matching template and are not
 * already instantiated for this Company.
 */
@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatMenuModule, KeyValueEditorComponent, ActionMenuComponent, DataTableComponent],
  templateUrl: './company-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyDetailComponent {
  protected readonly profile = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);
  private readonly companyMappingService = inject(CompanyMappingService);
  private readonly companyConfigurationService = inject(CompanyConfigurationService);
  private readonly interfaceService = inject(InterfaceService);
  private readonly dialog = inject(MatDialog);

  protected readonly companyId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly detail = signal<CompanyDetail | null>(null);
  protected readonly additionalData = signal<KeyValueRow[]>([]);
  protected readonly allInterfaces = signal<InterfaceSummary[]>([]);

  protected readonly mappingColumns: DataTableColumn<CompanyMappingSummary>[] = [
    { key: 'interfaceName', label: 'Interface' },
    { key: 'updatedAt', label: 'Updated At', value: (row) => new Date(row.updatedAt).toLocaleString() },
  ];

  protected readonly configurationColumns: DataTableColumn<CompanyConfigurationSummary>[] = [
    { key: 'interfaceName', label: 'Interface' },
    { key: 'updatedAt', label: 'Updated At', value: (row) => new Date(row.updatedAt).toLocaleString() },
  ];

  constructor() {
    this.loadDetail();
    this.reloadAdditionalData();
    // Interfaces are fetched once in a single large page; there is no dedicated
    // "available for this company" backend query yet, so eligibility (has the right
    // template, not already instantiated for this company) is filtered client-side.
    this.interfaceService.list('', 0, 1000).subscribe((page) => this.allInterfaces.set(page.content));
  }

  private loadDetail(): void {
    this.companyService.getDetail(this.companyId).subscribe((detail) => this.detail.set(detail));
  }

  private reloadAdditionalData(): void {
    this.companyService.getAdditionalData(this.companyId).subscribe((list) => {
      this.additionalData.set(
        list.map((entry) => ({
          key: entry.key,
          value: entry.value,
          caption: entry.sourceLevel === 'MANDATOR' ? 'From Mandator' : undefined,
        })),
      );
    });
  }

  onAdditionalDataEdit(change: KeyValueChange): void {
    this.companyService.setAdditionalData(this.companyId, change.key, change.value).subscribe(() => this.reloadAdditionalData());
  }

  onAdditionalDataAdd(change: KeyValueChange): void {
    this.companyService.setAdditionalData(this.companyId, change.key, change.value).subscribe(() => this.reloadAdditionalData());
  }

  onAdditionalDataDelete(key: string): void {
    this.companyService.deleteAdditionalData(this.companyId, key).subscribe(() => this.reloadAdditionalData());
  }

  /** Interfaces with a Mapping Template that this Company has not yet instantiated. */
  availableMappingInterfaces(): InterfaceSummary[] {
    const mappedInterfaceIds = new Set((this.detail()?.mappings ?? []).map((mapping) => mapping.interfaceId));
    return this.allInterfaces().filter((i) => i.hasMappingTemplate && !mappedInterfaceIds.has(i.id));
  }

  /** Interfaces with a Configuration Template that this Company has not yet instantiated. */
  availableConfigurationInterfaces(): InterfaceSummary[] {
    const configuredInterfaceIds = new Set((this.detail()?.configurations ?? []).map((configuration) => configuration.interfaceId));
    return this.allInterfaces().filter((i) => i.hasConfigurationTemplate && !configuredInterfaceIds.has(i.id));
  }

  onCreateMapping(interfaceId: number): void {
    this.companyMappingService
      .create(this.companyId, { interfaceId })
      .subscribe((created) => this.router.navigate(['/companies', this.companyId, 'mappings', created.id]));
  }

  onCreateConfiguration(interfaceId: number): void {
    this.companyConfigurationService
      .create(this.companyId, { interfaceId })
      .subscribe((created) => this.router.navigate(['/companies', this.companyId, 'configurations', created.id]));
  }

  onMappingRowClick(row: CompanyMappingSummary): void {
    this.router.navigate(['/companies', this.companyId, 'mappings', row.id]);
  }

  onConfigurationRowClick(row: CompanyConfigurationSummary): void {
    this.router.navigate(['/companies', this.companyId, 'configurations', row.id]);
  }

  buildMappingActions(row: CompanyMappingSummary): ActionMenuItem[] {
    return [
      { label: 'View Details', action: () => this.router.navigate(['/companies', this.companyId, 'mappings', row.id]) },
      ...(this.profile.can('CONFIGURATIONS_MAPPINGS', 'delete') ? [{ label: 'Delete', action: () => this.onDeleteMapping(row) }] : []),
    ];
  }

  buildConfigurationActions(row: CompanyConfigurationSummary): ActionMenuItem[] {
    return [
      { label: 'View Details', action: () => this.router.navigate(['/companies', this.companyId, 'configurations', row.id]) },
      ...(this.profile.can('CONFIGURATIONS_MAPPINGS', 'delete') ? [{ label: 'Delete', action: () => this.onDeleteConfiguration(row) }] : []),
    ];
  }

  private onDeleteMapping(row: CompanyMappingSummary): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Mapping', message: `Delete the mapping for "${row.interfaceName}"? This cannot be undone.` },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.companyMappingService.delete(this.companyId, row.id).subscribe(() => this.loadDetail());
      }
    });
  }

  private onDeleteConfiguration(row: CompanyConfigurationSummary): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Configuration', message: `Delete the configuration for "${row.interfaceName}"? This cannot be undone.` },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.companyConfigurationService.delete(this.companyId, row.id).subscribe(() => this.loadDetail());
      }
    });
  }

  onDeleteCompany(): void {
    const detail = this.detail();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Company', message: `Delete company "${detail?.name}"? This cannot be undone.` },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed && detail) {
        this.companyService.delete(this.companyId).subscribe(() => this.router.navigate(['/mandators', detail.mandatorId]));
      }
    });
  }
}
