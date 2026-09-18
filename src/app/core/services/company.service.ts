import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ResolvedAdditionalDataEntry } from '../models/additional-data.model';
import { CompanyCreateRequest, CompanyDetail, CompanyUpdateRequest } from '../models/company.model';

/** Client for the `/companies` (and `/mandators/{id}/companies`) endpoints. */
@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);

  /** Creates a new Company under the given Mandator. */
  create(mandatorId: number, request: CompanyCreateRequest): Observable<CompanyDetail> {
    return this.http.post<CompanyDetail>(`/mandators/${mandatorId}/companies`, request);
  }

  /** Fetches the full detail of a single Company. */
  getDetail(id: number): Observable<CompanyDetail> {
    return this.http.get<CompanyDetail>(`/companies/${id}`);
  }

  /** Updates a Company's own fields. */
  update(id: number, request: CompanyUpdateRequest): Observable<CompanyDetail> {
    return this.http.put<CompanyDetail>(`/companies/${id}`, request);
  }

  /** Deletes a Company. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/companies/${id}`);
  }

  /** Fetches a Company's resolved Additional Data (own overrides + values inherited from its Mandator). */
  getAdditionalData(id: number): Observable<ResolvedAdditionalDataEntry[]> {
    return this.http.get<ResolvedAdditionalDataEntry[]>(`/companies/${id}/additional-data`);
  }

  /** Sets a Company-level override for a single Additional Data key. */
  setAdditionalData(id: number, key: string, value: string): Observable<ResolvedAdditionalDataEntry> {
    return this.http.put<ResolvedAdditionalDataEntry>(`/companies/${id}/additional-data/${encodeURIComponent(key)}`, { value });
  }

  /** Removes a Company-level override, reverting the key to its Mandator-inherited value (if any). */
  deleteAdditionalData(id: number, key: string): Observable<void> {
    return this.http.delete<void>(`/companies/${id}/additional-data/${encodeURIComponent(key)}`);
  }
}
