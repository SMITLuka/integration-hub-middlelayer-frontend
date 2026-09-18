import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { KeyValueEditorComponent } from './key-value-editor.component';

describe('KeyValueEditorComponent', () => {
  let fixture: ComponentFixture<KeyValueEditorComponent>;
  let component: KeyValueEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyValueEditorComponent],
      providers: [{ provide: MatDialog, useValue: { open: () => ({ afterClosed: () => ({ subscribe: () => undefined }) }) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(KeyValueEditorComponent);
    component = fixture.componentInstance;
  });

  it('renders an edit-pencil button, not a delete-trash button, for a row with a caption (inherited value)', () => {
    component.rows = [{ key: 'timeoutSeconds', value: '30', caption: 'From Mandator' }];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('button[aria-label="Edit"]')).toBeTruthy();
    expect(compiled.querySelector('button[aria-label="Delete"]')).toBeFalsy();
    expect(compiled.textContent).toContain('From Mandator');
  });

  it('renders a delete-trash button, not an edit-pencil button, for a row without a caption (own explicit value)', () => {
    component.rows = [{ key: 'timeoutSeconds', value: '30' }];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('button[aria-label="Delete"]')).toBeTruthy();
    expect(compiled.querySelector('button[aria-label="Edit"]')).toBeFalsy();
  });

  it('emits delete with the row key when the delete button is clicked', () => {
    component.rows = [{ key: 'timeoutSeconds', value: '30' }];
    fixture.detectChanges();
    const emitted: string[] = [];
    component.delete.subscribe((key) => emitted.push(key));

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Delete"]')?.click();

    expect(emitted).toEqual(['timeoutSeconds']);
  });

  it('emits add with the trimmed key and value from the inline add form', () => {
    fixture.detectChanges();
    const emitted: { key: string; value: string }[] = [];
    component.add.subscribe((change) => emitted.push(change));

    component.newKey = '  newKey  ';
    component.newValue = 'newValue';
    component.onAddClick();

    expect(emitted).toEqual([{ key: 'newKey', value: 'newValue' }]);
    expect(component.newKey).toBe('');
    expect(component.newValue).toBe('');
  });

  it('does not emit add when the key is blank', () => {
    fixture.detectChanges();
    const emitted: unknown[] = [];
    component.add.subscribe((change) => emitted.push(change));

    component.newKey = '   ';
    component.onAddClick();

    expect(emitted.length).toBe(0);
  });
});
