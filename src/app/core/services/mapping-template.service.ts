import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SUPPRESS_ERROR_TOAST } from '../interceptors/error.interceptor';
import { MappingTemplate, MappingTemplateUpsertRequest } from '../models/mapping-template.model';

/** Client for the `/interfaces/{id}/mapping-template` endpoints. */
@Injectable({ providedIn: 'root' })
export class MappingTemplateService {
  private readonly http = inject(HttpClient);

  /**
   * Fetches an Interface's Mapping Template. Rejects with a 404 `HttpErrorResponse` if none exists
   * yet; pass `suppressErrorToast` when that 404 is an expected, handled case (e.g. the editor's first load).
   */
  get(interfaceId: number, options?: { suppressErrorToast?: boolean }): Observable<MappingTemplate> {
    const context = new HttpContext().set(SUPPRESS_ERROR_TOAST, options?.suppressErrorToast ?? false);
    return this.http.get<MappingTemplate>(`/interfaces/${interfaceId}/mapping-template`, { context });
  }

  /** Creates or fully replaces an Interface's Mapping Template (the backend's `replace` endpoint upserts). */
  replace(interfaceId: number, request: MappingTemplateUpsertRequest): Observable<MappingTemplate> {
    return this.http.put<MappingTemplate>(`/interfaces/${interfaceId}/mapping-template`, request);
  }

  /** Deletes an Interface's Mapping Template. Fails with 409 if it is still in use by a Company. */
  delete(interfaceId: number): Observable<void> {
    return this.http.delete<void>(`/interfaces/${interfaceId}/mapping-template`);
  }
}
