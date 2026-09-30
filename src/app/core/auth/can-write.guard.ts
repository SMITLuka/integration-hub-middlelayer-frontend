import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccessLevel, ProfileService } from './profile.service';

/**
 * Keeps users without write rights on a level out of its create/edit pages (e.g. via a bookmarked
 * URL), instead of letting them fill in a form the backend will reject. Presentation only: the
 * backend enforces the right on every request.
 */
export function canWrite(level: AccessLevel): CanActivateFn {
  return () => inject(ProfileService).can(level, 'write') || inject(Router).parseUrl('/');
}
