import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { canWrite } from './can-write.guard';
import { ProfileService } from './profile.service';

describe('canWrite guard', () => {
  function run(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      canWrite('MANDATORS_COMPANIES')({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  });

  it('lets users with write rights open the page', () => {
    TestBed.inject(ProfileService).user.set({
      name: 'A',
      email: null,
      permissions: [{ level: 'MANDATORS_COMPANIES', read: true, write: true, delete: true }],
    });

    expect(run()).toBeTrue();
  });

  it('sends readers to the dashboard instead of an edit form they cannot save', () => {
    TestBed.inject(ProfileService).user.set({
      name: 'B',
      email: null,
      permissions: [{ level: 'MANDATORS_COMPANIES', read: true, write: false, delete: false }],
    });

    expect((run() as UrlTree).toString()).toBe('/');
  });
});
