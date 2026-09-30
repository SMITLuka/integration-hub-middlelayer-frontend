import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfileService } from '../../auth/profile.service';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  function render(): HTMLElement {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('shows the profile with one icon per granted right and level', () => {
    TestBed.inject(ProfileService).user.set({
      name: 'Luka Lozić',
      email: 'luka@example.test',
      permissions: [
        { level: 'MANDATORS_COMPANIES', read: true, write: false, delete: false },
        { level: 'INTERFACES_TEMPLATES', read: true, write: false, delete: false },
        { level: 'CONFIGURATIONS_MAPPINGS', read: true, write: true, delete: false },
      ],
    });

    const element = render();
    const rows = Array.from(element.querySelectorAll('.rights-row'));

    expect(element.querySelector('.profile-name')?.textContent).toContain('Luka Lozić');
    expect(element.querySelector('.profile-email')?.textContent).toContain('luka@example.test');
    expect(rows.map((row) => row.querySelector('.rights-label')?.textContent?.trim())).toEqual([
      'Mandators & Companies',
      'Interfaces & Templates',
      'Configurations & Mappings',
    ]);
    expect(rows.map((row) => Array.from(row.querySelectorAll('mat-icon')).map((icon) => icon.textContent?.trim()))).toEqual([
      ['visibility'],
      ['visibility'],
      ['visibility', 'edit'],
    ]);
  });

  it('hides the profile box until the profile is loaded but always offers logout', () => {
    const element = render();

    expect(element.querySelector('.profile-box')).toBeNull();
    expect(element.querySelector('.logout-link')).not.toBeNull();
  });
});
