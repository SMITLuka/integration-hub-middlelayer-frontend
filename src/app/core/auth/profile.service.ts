import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** The three permission levels, as the backend names them. */
export type AccessLevel = 'MANDATORS_COMPANIES' | 'INTERFACES_TEMPLATES' | 'CONFIGURATIONS_MAPPINGS';
export type AccessRight = 'read' | 'write' | 'delete';

export interface LevelPermissions {
  level: AccessLevel;
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface CurrentUser {
  name: string | null;
  email: string | null;
  permissions: LevelPermissions[];
}

/**
 * The logged-in user and their rights, from the backend's GET /me. Used to show the profile box and
 * to hide actions the user may not perform. This is presentation only: the backend enforces every
 * right on each request regardless of what the UI shows.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  readonly user = signal<CurrentUser | null>(null);

  async load(): Promise<void> {
    this.user.set(await firstValueFrom(this.http.get<CurrentUser>('/me')));
  }

  /** False until the profile is loaded, so actions stay hidden rather than flash up and vanish. */
  can(level: AccessLevel, right: AccessRight): boolean {
    return this.user()?.permissions.find((p) => p.level === level)?.[right] ?? false;
  }
}
