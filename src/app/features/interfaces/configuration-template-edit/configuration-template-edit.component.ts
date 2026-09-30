import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { InterfaceService } from '../../../core/services/interface.service';
import { ConfigurationTemplateService } from '../../../core/services/configuration-template.service';
import {
  CONFIG_VALUE_TYPES,
  ConfigValueType,
  ConfigurationTemplateEntry,
  ConfigurationTemplateUpsertRequest,
} from '../../../core/models/configuration-template.model';
import { ProfileService } from '../../../core/auth/profile.service';

/** Typed controls for a single Configuration Template entry form. */
interface ConfigEntryFormControls {
  id: FormControl<number | null>;
  key: FormControl<string>;
  type: FormControl<ConfigValueType>;
  defaultValue: FormControl<string>;
  expression: FormControl<string>;
  description: FormControl<string>;
}

type ConfigEntryForm = FormGroup<ConfigEntryFormControls>;

/**
 * Interface Configuration Template editor: a repeatable list of Key/Type/Default
 * Value/Expression/Description entry rows. Save always performs a full-replace
 * (the backend's `replace` endpoint upserts, so this same form serves both the
 * "no template yet" and "editing" cases). Rejects a Save with duplicate keys
 * client-side, mirroring the backend's own uniqueness rule.
 */
@Component({
  selector: 'app-configuration-template-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './configuration-template-edit.component.html',
  styleUrl: './configuration-template-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationTemplateEditComponent {
  protected readonly profile = inject(ProfileService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interfaceService = inject(InterfaceService);
  private readonly configurationTemplateService = inject(ConfigurationTemplateService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly interfaceId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly interfaceName = signal('');
  protected readonly configValueTypes = CONFIG_VALUE_TYPES;

  protected readonly entries: FormArray<ConfigEntryForm> = this.fb.array<ConfigEntryForm>([]);

  constructor() {
    this.interfaceService.getDetail(this.interfaceId).subscribe((detail) => this.interfaceName.set(detail.name));

    this.configurationTemplateService
      .get(this.interfaceId, { suppressErrorToast: true })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null);
          }
          throw error;
        }),
      )
      .subscribe((template) => {
        template?.entries.forEach((entry) => this.entries.push(this.buildEntryForm(entry)));
        if (!this.profile.can('INTERFACES_TEMPLATES', 'write')) {
          // Readers may look at the template, not change it (the backend rejects changes anyway).
          this.entries.disable();
        } else if (this.entries.length === 0) {
          this.addEntry();
        }
      });
  }

  private buildEntryForm(entry?: ConfigurationTemplateEntry): ConfigEntryForm {
    return this.fb.group({
      id: this.fb.control<number | null>(entry?.id ?? null),
      key: this.fb.nonNullable.control(entry?.key ?? '', Validators.required),
      type: this.fb.nonNullable.control<ConfigValueType>(entry?.type ?? 'TEXT', Validators.required),
      defaultValue: this.fb.nonNullable.control(entry?.defaultValue ?? ''),
      expression: this.fb.nonNullable.control(entry?.expression ?? ''),
      description: this.fb.nonNullable.control(entry?.description ?? ''),
    });
  }

  addEntry(): void {
    this.entries.push(this.buildEntryForm());
  }

  removeEntry(index: number): void {
    this.entries.removeAt(index);
  }

  /** Returns the first key that occurs more than once across entries, or `null` if all keys are unique. */
  private findDuplicateKey(): string | null {
    const seen = new Set<string>();
    for (const entry of this.entries.controls) {
      const key = entry.controls.key.value.trim();
      if (key && seen.has(key)) {
        return key;
      }
      seen.add(key);
    }
    return null;
  }

  save(): void {
    if (this.entries.invalid) {
      this.entries.markAllAsTouched();
      return;
    }
    const duplicateKey = this.findDuplicateKey();
    if (duplicateKey) {
      this.snackBar.open(`Duplicate key: ${duplicateKey}`, 'Dismiss', { duration: 6000 });
      return;
    }
    const request: ConfigurationTemplateUpsertRequest = {
      entries: this.entries.controls.map((entry, index) => ({
        id: entry.controls.id.value,
        key: entry.controls.key.value,
        type: entry.controls.type.value,
        defaultValue: entry.controls.defaultValue.value,
        expression: entry.controls.expression.value,
        description: entry.controls.description.value,
        sortOrder: index,
      })),
    };
    this.configurationTemplateService
      .replace(this.interfaceId, request)
      .subscribe(() => this.router.navigate(['/interfaces', this.interfaceId]));
  }
}
