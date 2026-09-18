import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CompanyMappingSummary } from '../models/company.model';
import { CompanyMappingCreateRequest, CompanyMappingDetail, ResolvedMappingRow } from '../models/company-mapping.model';

/** Client for the `/companies/{companyId}/mappings` endpoints. */
@Injectable({ providedIn: 'root' })
export class CompanyMappingService {
  private readonly http = inject(HttpClient);

  /** Fetches the Company Mappings already instantiated for a given Company. */
  list(companyId: number): Observable<CompanyMappingSummary[]> {
    return this.http.get<CompanyMappingSummary[]>(`/companies/${companyId}/mappings`);
  }

  /** Instantiates an Interface's Mapping Template on a Company. */
  create(companyId: number, request: CompanyMappingCreateRequest): Observable<CompanyMappingDetail> {
    return this.http.post<CompanyMappingDetail>(`/companies/${companyId}/mappings`, request);
  }

  /** Fetches the full resolved detail (sections and rows) of one Company Mapping. */
  getDetail(companyId: number, mappingId: number): Observable<CompanyMappingDetail> {
    return this.http.get<CompanyMappingDetail>(`/companies/${companyId}/mappings/${mappingId}`);
  }

  /** Sets a Company-level override value for a single Mapping row. */
  setRowOverride(companyId: number, mappingId: number, templateRowId: number, value: string): Observable<ResolvedMappingRow> {
    return this.http.put<ResolvedMappingRow>(`/companies/${companyId}/mappings/${mappingId}/rows/${templateRowId}`, { value });
  }

  /** Deletes a Mapping row's override, reverting it to the Mapping Template's value. */
  deleteRowOverride(companyId: number, mappingId: number, templateRowId: number): Observable<ResolvedMappingRow> {
    return this.http.delete<ResolvedMappingRow>(`/companies/${companyId}/mappings/${mappingId}/rows/${templateRowId}`);
  }

  /** Deletes a Company Mapping entirely. */
  delete(companyId: number, mappingId: number): Observable<void> {
    return this.http.delete<void>(`/companies/${companyId}/mappings/${mappingId}`);
  }
}
