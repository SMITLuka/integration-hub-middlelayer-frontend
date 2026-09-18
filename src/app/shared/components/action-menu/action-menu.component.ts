import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

/** A single selectable entry in an {@link ActionMenuComponent}. */
export interface ActionMenuItem {
  label: string;
  action: () => void;
}

/**
 * Reusable "..." row action menu (e.g. "View Details" / "Edit" on a table row).
 */
@Component({
  selector: 'app-action-menu',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './action-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionMenuComponent {
  @Input() items: ActionMenuItem[] = [];

  /** Invokes the selected item's action callback. */
  onSelect(item: ActionMenuItem): void {
    item.action();
  }
}
