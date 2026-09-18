import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/** Describes a single column of a {@link DataTableComponent}. */
export interface DataTableColumn<T> {
  /** Property key on the row, used as a fallback cell renderer when `value` is not given. */
  key: keyof T & string;
  /** Column header text. */
  label: string;
  /** Optional custom cell value accessor; falls back to `row[key]` when omitted. */
  value?: (row: T) => string;
}

/**
 * Generic, reusable data table: search box, configurable columns, optional
 * per-row action-menu slot (via a projected `ng-template`), row-click and
 * pagination controls styled like DICM's list screens.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSelectModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T> implements OnDestroy {
  @Input() columns: DataTableColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() searchPlaceholder = 'Search';
  @Input() emptyMessage = 'No entries found.';
  @Input() showSearch = true;
  @Input() showPagination = true;

  @Input() totalElements = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 20;
  @Input() pageSizeOptions: number[] = [10, 20, 50];

  @Output() rowClick = new EventEmitter<T>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() pageIndexChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  /** Optional `<ng-template let-row>` projected by the parent for per-row actions. */
  @ContentChild(TemplateRef) rowActionsTemplate?: TemplateRef<{ $implicit: T }>;

  searchTerm = '';

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.searchInput$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => this.searchChange.emit(term));
  }

  ngOnDestroy(): void {
    this.searchInput$.complete();
  }

  /** Reads a column's display value for a given row. */
  cellValue(column: DataTableColumn<T>, row: T): string {
    if (column.value) {
      return column.value(row);
    }
    const raw = row[column.key];
    return raw === null || raw === undefined ? '' : String(raw);
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchInput$.next(value);
  }

  onPageSizeSelected(size: number): void {
    this.pageSizeChange.emit(size);
  }

  goToPreviousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndexChange.emit(this.pageIndex - 1);
    }
  }

  goToNextPage(): void {
    if (this.hasNextPage) {
      this.pageIndexChange.emit(this.pageIndex + 1);
    }
  }

  get hasNextPage(): boolean {
    return (this.pageIndex + 1) * this.pageSize < this.totalElements;
  }

  get rangeStart(): number {
    return this.totalElements === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalElements);
  }
}
