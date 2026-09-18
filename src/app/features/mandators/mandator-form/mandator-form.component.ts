import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MandatorService } from '../../../core/services/mandator.service';
import { KeyValueChange, KeyValueEditorComponent, KeyValueRow } from '../../../shared/components/key-value-editor/key-value-editor.component';

type FormMode = 'create' | 'edit';

/**
 * Mandator create/edit reactive form. On the edit route it also shows the
 * Mandator's own Additional Data (no inheritance concept at this level).
 */
@Component({
  selector: 'app-mandator-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, KeyValueEditorComponent],
  templateUrl: './mandator-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MandatorFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mandatorService = inject(MandatorService);

  protected readonly mode: FormMode = this.route.snapshot.data['mode'] ?? 'create';
  private readonly mandatorId = this.mode === 'edit' ? Number(this.route.snapshot.paramMap.get('id')) : null;

  protected readonly additionalData = signal<KeyValueRow[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    system: [''],
    customer: [''],
    externalMandatorId: [''],
    country: [''],
    locale: [''],
  });

  constructor() {
    if (this.mode === 'edit' && this.mandatorId !== null) {
      this.mandatorService.getDetail(this.mandatorId).subscribe((detail) => {
        this.form.patchValue({
          name: detail.name,
          system: detail.system ?? '',
          customer: detail.customer ?? '',
          externalMandatorId: detail.externalMandatorId ?? '',
          country: detail.country ?? '',
          locale: detail.locale ?? '',
        });
        this.additionalData.set(detail.additionalData.map((entry) => ({ key: entry.key, value: entry.value })));
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (this.mode === 'create') {
      this.mandatorService.create(value).subscribe((detail) => this.router.navigate(['/mandators', detail.id]));
    } else if (this.mandatorId !== null) {
      this.mandatorService.update(this.mandatorId, value).subscribe((detail) => this.router.navigate(['/mandators', detail.id]));
    }
  }

  onAdditionalDataAdd(change: KeyValueChange): void {
    if (this.mandatorId === null) {
      return;
    }
    this.mandatorService.setAdditionalData(this.mandatorId, change.key, change.value).subscribe(() => this.reloadAdditionalData());
  }

  onAdditionalDataDelete(key: string): void {
    if (this.mandatorId === null) {
      return;
    }
    this.mandatorService.deleteAdditionalData(this.mandatorId, key).subscribe(() => this.reloadAdditionalData());
  }

  private reloadAdditionalData(): void {
    if (this.mandatorId === null) {
      return;
    }
    this.mandatorService
      .getAdditionalData(this.mandatorId)
      .subscribe((list) => this.additionalData.set(list.map((entry) => ({ key: entry.key, value: entry.value }))));
  }
}
