import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdditionalDataEntry } from '../models/additional-data.model';
import { InterfaceCreateRequest, InterfaceDetail, InterfaceSummary, InterfaceUpdateRequest } from '../models/interface.model';
import { Page } from '../models/page.model';

/** Client for the `/interfaces` endpoints. */
@Injectable({ providedIn: 'root' })
export class InterfaceService {
  private readonly http = inject(HttpClient);

  /** Fetches a page of Interfaces, optionally filtered by a free-text search term. */
  list(search: string, page: number, size: number): Observable<Page<InterfaceSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Page<InterfaceSummary>>('/interfaces', { params });
  }

  /** Creates a new Interface. */
  create(request: InterfaceCreateRequest): Observable<InterfaceDetail> {
    return this.http.post<InterfaceDetail>('/interfaces', request);
  }

  /** Fetches the full detail of a single Interface, including its Additional Data and usages. */
  getDetail(id: number): Observable<InterfaceDetail> {
    return this.http.get<InterfaceDetail>(`/interfaces/${id}`);
  }

  /** Updates an Interface's own fields. */
  update(id: number, request: InterfaceUpdateRequest): Observable<InterfaceDetail> {
    return this.http.put<InterfaceDetail>(`/interfaces/${id}`, request);
  }

  /** Deletes an Interface. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/interfaces/${id}`);
  }

  /** Fetches an Interface's own Additional Data entries. */
  getAdditionalData(id: number): Observable<AdditionalDataEntry[]> {
    return this.http.get<AdditionalDataEntry[]>(`/interfaces/${id}/additional-data`);
  }

  /** Creates or updates a single Additional Data key for an Interface. */
  setAdditionalData(id: number, key: string, value: string): Observable<AdditionalDataEntry> {
    return this.http.put<AdditionalDataEntry>(`/interfaces/${id}/additional-data/${encodeURIComponent(key)}`, { value });
  }

  /** Deletes a single Additional Data key from an Interface. */
  deleteAdditionalData(id: number, key: string): Observable<void> {
    return this.http.delete<void>(`/interfaces/${id}/additional-data/${encodeURIComponent(key)}`);
  }
}
