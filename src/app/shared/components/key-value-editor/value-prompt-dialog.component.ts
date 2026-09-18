import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/** Data passed into a {@link ValuePromptDialogComponent}. */
export interface ValuePromptDialogData {
  title: string;
  value: string;
  label?: string;
}

/**
 * Small single-field dialog used by {@link KeyValueEditorComponent} to prompt
 * for a new value when editing an inherited Additional Data key.
 */
@Component({
  selector: 'app-value-prompt-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './value-prompt-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValuePromptDialogComponent {
  protected readonly dialogRef = inject(MatDialogRef<ValuePromptDialogComponent, string>);
  protected readonly data: ValuePromptDialogData = inject(MAT_DIALOG_DATA);
  protected value = this.data.value;
}
