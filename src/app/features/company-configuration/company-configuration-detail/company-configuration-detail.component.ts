import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CompanyService } from '../../../core/services/company.service';
import { CompanyConfigurationService } from '../../../core/services/company-configuration.service';
import { CompanyConfigurationDetail, ConfigSourceLevel, ResolvedConfigEntry } from '../../../core/models/company-configuration.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ValuePromptDialogComponent } from '../../../shared/components/key-value-editor/value-prompt-dialog.component';
import { ProfileService } from '../../../core/auth/profile.service';

/** Caption shown under an entry's effective value for each non-override resolution level. */
const SOURCE_LEVEL_CAPTIONS: Partial<Record<ConfigSourceLevel, string>> = {
  TEMPLATE: 'From Template',
  MANDATOR: 'From Mandator',
  COMPANY: 'From Company',
};

/**
 * Company Configuration detail screen: a flat list of a Configuration Template's entries,
 * each resolved through the 4-level cascade (Override on this Company+Interface, else
 * Company-level, else Mandator-level, else the Template's own default). OVERRIDE entries
 * show a red delete-trash with no caption; every other level shows an edit-pencil with a
 * caption naming where the value currently comes from. The backend is always re-queried
 * after a write so the displayed cascade fallback is never computed client-side.
 */
@Component({
  selector: 'app-company-configuration-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './company-configuration-detail.component.html',
  styleUrl: './company-configuration-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyConfigurationDetailComponent {
  protected readonly profile = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);
  private readonly companyConfigurationService = inject(CompanyConfigurationService);
  private readonly dialog = inject(MatDialog);

  protected readonly companyId = Number(this.route.snapshot.paramMap.get('companyId'));
  protected readonly configId = Number(this.route.snapshot.paramMap.get('configId'));
  protected readonly detail = signal<CompanyConfigurationDetail | null>(null);
  protected readonly companyName = signal('');

  constructor() {
    this.companyService.getDetail(this.companyId).subscribe((company) => this.companyName.set(company.name));
    this.reload();
  }

  private reload(): void {
    this.companyConfigurationService.getDetail(this.companyId, this.configId).subscribe((detail) => this.detail.set(detail));
  }

  /** Caption to show under an entry's value, or `null` for an explicit OVERRIDE entry. */
  captionFor(entry: ResolvedConfigEntry): string | null {
    return SOURCE_LEVEL_CAPTIONS[entry.sourceLevel] ?? null;
  }

  onEditEntry(entry: ResolvedConfigEntry): void {
    const ref = this.dialog.open(ValuePromptDialogComponent, {
      width: '360px',
      data: { title: `Edit ${entry.key}`, value: entry.effectiveValue ?? '' },
    });
    ref.afterClosed().subscribe((value) => {
      if (value !== undefined && value !== null) {
        this.companyConfigurationService
          .setEntryOverride(this.companyId, this.configId, entry.templateEntryId, value)
          .subscribe(() => this.reload());
      }
    });
  }

  onDeleteEntry(entry: ResolvedConfigEntry): void {
    this.companyConfigurationService
      .deleteEntryOverride(this.companyId, this.configId, entry.templateEntryId)
      .subscribe(() => this.reload());
  }

  onDeleteConfiguration(): void {
    const detail = this.detail();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Configuration', message: `Delete the configuration for "${detail?.interfaceName}"? This cannot be undone.` },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.companyConfigurationService
          .delete(this.companyId, this.configId)
          .subscribe(() => this.router.navigate(['/companies', this.companyId]));
      }
    });
  }
}
