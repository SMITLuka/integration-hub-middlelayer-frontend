import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CurrentUser, ProfileService } from './profile.service';

const employee: CurrentUser = {
  name: 'Luka Lozić',
  email: 'luka@example.test',
  permissions: [
    { level: 'MANDATORS_COMPANIES', read: true, write: false, delete: false },
    { level: 'INTERFACES_TEMPLATES', read: true, write: false, delete: false },
    { level: 'CONFIGURATIONS_MAPPINGS', read: true, write: true, delete: false },
  ],
};

describe('ProfileService', () => {
  let service: ProfileService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProfileService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('grants nothing until the profile is loaded', () => {
    expect(service.can('CONFIGURATIONS_MAPPINGS', 'read')).toBeFalse();
  });

  it('loads the current user from /me and answers per level and right', async () => {
    const loading = service.load();
    httpTesting.expectOne('/me').flush(employee);
    await loading;

    expect(service.user()?.name).toBe('Luka Lozić');
    expect(service.can('MANDATORS_COMPANIES', 'read')).toBeTrue();
    expect(service.can('MANDATORS_COMPANIES', 'write')).toBeFalse();
    expect(service.can('INTERFACES_TEMPLATES', 'delete')).toBeFalse();
    expect(service.can('CONFIGURATIONS_MAPPINGS', 'write')).toBeTrue();
    expect(service.can('CONFIGURATIONS_MAPPINGS', 'delete')).toBeFalse();
  });
});
