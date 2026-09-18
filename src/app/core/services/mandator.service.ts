import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdditionalDataEntry } from '../models/additional-data.model';
import { MandatorCreateRequest, MandatorDetail, MandatorSummary, MandatorUpdateRequest } from '../models/mandator.model';
import { Page } from '../models/page.model';

/** Client for the `/mandators` endpoints. */
@Injectable({ providedIn: 'root' })
export class MandatorService {
  private readonly http = inject(HttpClient);

  /** Fetches a page of Mandators, optionally filtered by a free-text search term. */
  list(search: string, page: number, size: number): Observable<Page<MandatorSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Page<MandatorSummary>>('/mandators', { params });
  }

  /** Creates a new Mandator. */
  create(request: MandatorCreateRequest): Observable<MandatorDetail> {
    return this.http.post<MandatorDetail>('/mandators', request);
  }

  /** Fetches the full detail of a single Mandator, including its Additional Data and Companies. */
  getDetail(id: number): Observable<MandatorDetail> {
    return this.http.get<MandatorDetail>(`/mandators/${id}`);
  }

  /** Updates a Mandator's own fields. */
  update(id: number, request: MandatorUpdateRequest): Observable<MandatorDetail> {
    return this.http.put<MandatorDetail>(`/mandators/${id}`, request);
  }

  /** Deletes a Mandator. Fails with 409 if it still has Companies. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/mandators/${id}`);
  }

  /** Fetches a Mandator's own Additional Data entries. */
  getAdditionalData(id: number): Observable<AdditionalDataEntry[]> {
    return this.http.get<AdditionalDataEntry[]>(`/mandators/${id}/additional-data`);
  }

  /** Creates or updates a single Additional Data key for a Mandator. */
  setAdditionalData(id: number, key: string, value: string): Observable<AdditionalDataEntry> {
    return this.http.put<AdditionalDataEntry>(`/mandators/${id}/additional-data/${encodeURIComponent(key)}`, { value });
  }

  /** Deletes a single Additional Data key from a Mandator. */
  deleteAdditionalData(id: number, key: string): Observable<void> {
    return this.http.delete<void>(`/mandators/${id}/additional-data/${encodeURIComponent(key)}`);
  }
}
