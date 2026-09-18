import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SUPPRESS_ERROR_TOAST } from '../interceptors/error.interceptor';
import { ConfigurationTemplate, ConfigurationTemplateUpsertRequest } from '../models/configuration-template.model';

/** Client for the `/interfaces/{id}/configuration-template` endpoints. */
@Injectable({ providedIn: 'root' })
export class ConfigurationTemplateService {
  private readonly http = inject(HttpClient);

  /**
   * Fetches an Interface's Configuration Template. Rejects with a 404 `HttpErrorResponse` if none exists
   * yet; pass `suppressErrorToast` when that 404 is an expected, handled case (e.g. the editor's first load).
   */
  get(interfaceId: number, options?: { suppressErrorToast?: boolean }): Observable<ConfigurationTemplate> {
    const context = new HttpContext().set(SUPPRESS_ERROR_TOAST, options?.suppressErrorToast ?? false);
    return this.http.get<ConfigurationTemplate>(`/interfaces/${interfaceId}/configuration-template`, { context });
  }

  /** Creates or fully replaces an Interface's Configuration Template (the backend's `replace` endpoint upserts). */
  replace(interfaceId: number, request: ConfigurationTemplateUpsertRequest): Observable<ConfigurationTemplate> {
    return this.http.put<ConfigurationTemplate>(`/interfaces/${interfaceId}/configuration-template`, request);
  }

  /** Deletes an Interface's Configuration Template. Fails with 409 if it is still in use by a Company. */
  delete(interfaceId: number): Observable<void> {
    return this.http.delete<void>(`/interfaces/${interfaceId}/configuration-template`);
  }
}
