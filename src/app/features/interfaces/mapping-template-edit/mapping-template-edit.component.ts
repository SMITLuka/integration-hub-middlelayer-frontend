import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { catchError, of } from 'rxjs';
import { InterfaceService } from '../../../core/services/interface.service';
import { MappingTemplateService } from '../../../core/services/mapping-template.service';
import { MappingTemplateRow, MappingTemplateSection, MappingTemplateUpsertRequest } from '../../../core/models/mapping-template.model';

/** Typed controls for a single Mapping Template row form. */
interface MappingRowFormControls {
  id: FormControl<number | null>;
  descriptor: FormControl<string>;
  thirdPartyValue: FormControl<string>;
}

/** Typed controls for a single Mapping Template section form. */
interface MappingSectionFormControls {
  id: FormControl<number | null>;
  name: FormControl<string>;
  rows: FormArray<FormGroup<MappingRowFormControls>>;
}

type MappingRowForm = FormGroup<MappingRowFormControls>;
type MappingSectionForm = FormGroup<MappingSectionFormControls>;

/**
 * Interface Mapping Template editor: a repeatable list of named Sections,
 * each containing a repeatable list of Descriptor / Third Party Value rows.
 * Save always performs a full-replace (the backend's `replace` endpoint upserts,
 * so this same form serves both the "no template yet" and "editing" cases).
 */
@Component({
  selector: 'app-mapping-template-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './mapping-template-edit.component.html',
  styleUrl: './mapping-template-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MappingTemplateEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interfaceService = inject(InterfaceService);
  private readonly mappingTemplateService = inject(MappingTemplateService);

  protected readonly interfaceId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly interfaceName = signal('');

  protected readonly sections: FormArray<MappingSectionForm> = this.fb.array<MappingSectionForm>([]);

  constructor() {
    this.interfaceService.getDetail(this.interfaceId).subscribe((detail) => this.interfaceName.set(detail.name));

    this.mappingTemplateService
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
        template?.sections.forEach((section) => this.sections.push(this.buildSectionForm(section)));
        if (this.sections.length === 0) {
          this.addSection();
        }
      });
  }

  private buildRowForm(row?: MappingTemplateRow): MappingRowForm {
    return this.fb.group({
      id: this.fb.control<number | null>(row?.id ?? null),
      descriptor: this.fb.nonNullable.control(row?.descriptor ?? '', Validators.required),
      thirdPartyValue: this.fb.nonNullable.control(row?.thirdPartyValue ?? ''),
    });
  }

  private buildSectionForm(section?: MappingTemplateSection): MappingSectionForm {
    const initialRows = section?.rows?.length ? section.rows : [undefined];
    const rows = this.fb.array(initialRows.map((row) => this.buildRowForm(row)));
    return this.fb.group({
      id: this.fb.control<number | null>(section?.id ?? null),
      name: this.fb.nonNullable.control(section?.name ?? '', Validators.required),
      rows,
    });
  }

  /** Reads a section form's rows FormArray (used from the template, where the typed field can't be indexed directly). */
  protected rowsOf(section: MappingSectionForm): FormArray<MappingRowForm> {
    return section.controls.rows;
  }

  addSection(): void {
    this.sections.push(this.buildSectionForm());
  }

  removeSection(index: number): void {
    this.sections.removeAt(index);
  }

  addRow(section: MappingSectionForm): void {
    section.controls.rows.push(this.buildRowForm());
  }

  removeRow(section: MappingSectionForm, index: number): void {
    section.controls.rows.removeAt(index);
  }

  save(): void {
    if (this.sections.invalid) {
      this.sections.markAllAsTouched();
      return;
    }
    const request: MappingTemplateUpsertRequest = {
      sections: this.sections.controls.map((section, sectionIndex) => ({
        id: section.controls.id.value,
        name: section.controls.name.value,
        sortOrder: sectionIndex,
        rows: section.controls.rows.controls.map((row, rowIndex) => ({
          id: row.controls.id.value,
          descriptor: row.controls.descriptor.value,
          thirdPartyValue: row.controls.thirdPartyValue.value,
          sortOrder: rowIndex,
        })),
      })),
    };
    this.mappingTemplateService.replace(this.interfaceId, request).subscribe(() => this.router.navigate(['/interfaces', this.interfaceId]));
  }
}
