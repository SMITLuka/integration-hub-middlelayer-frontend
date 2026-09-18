import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ValuePromptDialogComponent } from './value-prompt-dialog.component';

/**
 * A single row shown by {@link KeyValueEditorComponent}.
 *
 * When `caption` is present the row is rendered as inherited: the caption text
 * is shown under the value together with an edit-pencil button. When `caption`
 * is absent the row is this level's own explicit value, rendered with a
 * delete/trash button instead.
 */
export interface KeyValueRow {
  key: string;
  value: string;
  caption?: string;
}

/** Payload emitted by the `edit` and `add` outputs. */
export interface KeyValueChange {
  key: string;
  value: string;
}

/**
 * Displays a list of key/value rows with either an "inherited, edit to override"
 * affordance (caption present) or an "own value, delete to revert" affordance
 * (caption absent), plus an optional inline "add new key" form.
 */
@Component({
  selector: 'app-key-value-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './key-value-editor.component.html',
  styleUrl: './key-value-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyValueEditorComponent {
  @Input() rows: KeyValueRow[] = [];
  @Input() allowAdd = true;
  @Input() addKeyLabel = 'Key';
  @Input() addValueLabel = 'Value';

  @Output() edit = new EventEmitter<KeyValueChange>();
  @Output() delete = new EventEmitter<string>();
  @Output() add = new EventEmitter<KeyValueChange>();

  private readonly dialog = inject(MatDialog);

  newKey = '';
  newValue = '';

  /** Opens the value-prompt dialog for an inherited row and emits `edit` on confirm. */
  onEditClick(row: KeyValueRow): void {
    const ref = this.dialog.open(ValuePromptDialogComponent, {
      width: '360px',
      data: { title: `Edit ${row.key}`, value: row.value },
    });
    ref.afterClosed().subscribe((value) => {
      if (value !== undefined && value !== null) {
        this.edit.emit({ key: row.key, value });
      }
    });
  }

  /** Emits `delete` for this level's own explicit value. */
  onDeleteClick(row: KeyValueRow): void {
    this.delete.emit(row.key);
  }

  /** Emits `add` for the inline "new key" form, then clears it. */
  onAddClick(): void {
    const key = this.newKey.trim();
    if (!key) {
      return;
    }
    this.add.emit({ key, value: this.newValue });
    this.newKey = '';
    this.newValue = '';
  }
}
