import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { InterfaceService } from '../../../core/services/interface.service';
import { KeyValueChange, KeyValueEditorComponent, KeyValueRow } from '../../../shared/components/key-value-editor/key-value-editor.component';

type FormMode = 'create' | 'edit';

/**
 * Interface create/edit reactive form. On the edit route it also shows the
 * Interface's own Additional Data (no inheritance concept at this level).
 */
@Component({
  selector: 'app-interface-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, KeyValueEditorComponent],
  templateUrl: './interface-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interfaceService = inject(InterfaceService);

  protected readonly mode: FormMode = this.route.snapshot.data['mode'] ?? 'create';
  private readonly interfaceId = this.mode === 'edit' ? Number(this.route.snapshot.paramMap.get('id')) : null;

  protected readonly additionalData = signal<KeyValueRow[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    dmsToMiddlewareUrl: [''],
    oemToMiddlewareUrl: [''],
    middlewareToOemUrl: [''],
  });

  constructor() {
    if (this.mode === 'edit' && this.interfaceId !== null) {
      this.interfaceService.getDetail(this.interfaceId).subscribe((detail) => {
        this.form.patchValue({
          name: detail.name,
          dmsToMiddlewareUrl: detail.dmsToMiddlewareUrl ?? '',
          oemToMiddlewareUrl: detail.oemToMiddlewareUrl ?? '',
          middlewareToOemUrl: detail.middlewareToOemUrl ?? '',
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
      this.interfaceService.create(value).subscribe((detail) => this.router.navigate(['/interfaces', detail.id]));
    } else if (this.interfaceId !== null) {
      this.interfaceService.update(this.interfaceId, value).subscribe((detail) => this.router.navigate(['/interfaces', detail.id]));
    }
  }

  onAdditionalDataAdd(change: KeyValueChange): void {
    if (this.interfaceId === null) {
      return;
    }
    this.interfaceService.setAdditionalData(this.interfaceId, change.key, change.value).subscribe(() => this.reloadAdditionalData());
  }

  onAdditionalDataDelete(key: string): void {
    if (this.interfaceId === null) {
      return;
    }
    this.interfaceService.deleteAdditionalData(this.interfaceId, key).subscribe(() => this.reloadAdditionalData());
  }

  private reloadAdditionalData(): void {
    if (this.interfaceId === null) {
      return;
    }
    this.interfaceService
      .getAdditionalData(this.interfaceId)
      .subscribe((list) => this.additionalData.set(list.map((entry) => ({ key: entry.key, value: entry.value }))));
  }
}
