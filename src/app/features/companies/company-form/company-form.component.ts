import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CompanyService } from '../../../core/services/company.service';

type FormMode = 'create' | 'edit';

/**
 * Company create/edit reactive form. Create runs under a Mandator
 * (`/mandators/:mandatorId/companies/new`); edit targets an existing
 * Company by id (`/companies/:id/edit`).
 */
@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './company-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);

  protected readonly mode: FormMode = this.route.snapshot.data['mode'] ?? 'create';
  private readonly companyId = this.mode === 'edit' ? Number(this.route.snapshot.paramMap.get('id')) : null;
  private mandatorId = this.mode === 'create' ? Number(this.route.snapshot.paramMap.get('mandatorId')) : null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    dmsCompanyId: [''],
    location: [''],
    countryCode: [''],
    customerNumber: [''],
    defaultLocale: [''],
  });

  constructor() {
    if (this.mode === 'edit' && this.companyId !== null) {
      this.companyService.getDetail(this.companyId).subscribe((detail) => {
        this.mandatorId = detail.mandatorId;
        this.form.patchValue({
          name: detail.name,
          dmsCompanyId: detail.dmsCompanyId ?? '',
          location: detail.location ?? '',
          countryCode: detail.countryCode ?? '',
          customerNumber: detail.customerNumber ?? '',
          defaultLocale: detail.defaultLocale ?? '',
        });
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (this.mode === 'create' && this.mandatorId !== null) {
      this.companyService.create(this.mandatorId, value).subscribe((detail) => this.router.navigate(['/companies', detail.id]));
    } else if (this.mode === 'edit' && this.companyId !== null) {
      this.companyService.update(this.companyId, value).subscribe((detail) => this.router.navigate(['/companies', detail.id]));
    }
  }

  cancelLink(): unknown[] {
    if (this.mode === 'edit' && this.companyId !== null) {
      return ['/companies', this.companyId];
    }
    if (this.mandatorId !== null) {
      return ['/mandators', this.mandatorId];
    }
    return ['/mandators'];
  }
}
