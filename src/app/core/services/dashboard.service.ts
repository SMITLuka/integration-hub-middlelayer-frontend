import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardSummary } from '../models/dashboard-summary.model';

/** Client for the `/dashboard` endpoints. */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  /** Fetches the counts shown on the dashboard's summary cards. */
  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>('/dashboard/summary');
  }
}
