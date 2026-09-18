import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CompanyConfigurationSummary } from '../models/company.model';
import { CompanyConfigurationCreateRequest, CompanyConfigurationDetail, ResolvedConfigEntry } from '../models/company-configuration.model';

/** Client for the `/companies/{companyId}/configurations` endpoints. */
@Injectable({ providedIn: 'root' })
export class CompanyConfigurationService {
  private readonly http = inject(HttpClient);

  /** Fetches the Company Configurations already instantiated for a given Company. */
  list(companyId: number): Observable<CompanyConfigurationSummary[]> {
    return this.http.get<CompanyConfigurationSummary[]>(`/companies/${companyId}/configurations`);
  }

  /** Instantiates an Interface's Configuration Template on a Company. */
  create(companyId: number, request: CompanyConfigurationCreateRequest): Observable<CompanyConfigurationDetail> {
    return this.http.post<CompanyConfigurationDetail>(`/companies/${companyId}/configurations`, request);
  }

  /** Fetches the full resolved detail (all entries) of one Company Configuration. */
  getDetail(companyId: number, configId: number): Observable<CompanyConfigurationDetail> {
    return this.http.get<CompanyConfigurationDetail>(`/companies/${companyId}/configurations/${configId}`);
  }

  /** Sets a Company-level override value for a single Configuration entry. */
  setEntryOverride(companyId: number, configId: number, templateEntryId: number, value: string): Observable<ResolvedConfigEntry> {
    return this.http.put<ResolvedConfigEntry>(`/companies/${companyId}/configurations/${configId}/entries/${templateEntryId}`, { value });
  }

  /** Deletes a Configuration entry's override, falling back to the next level in the cascade. */
  deleteEntryOverride(companyId: number, configId: number, templateEntryId: number): Observable<ResolvedConfigEntry> {
    return this.http.delete<ResolvedConfigEntry>(`/companies/${companyId}/configurations/${configId}/entries/${templateEntryId}`);
  }

  /** Deletes a Company Configuration entirely. */
  delete(companyId: number, configId: number): Observable<void> {
    return this.http.delete<void>(`/companies/${companyId}/configurations/${configId}`);
  }
}
