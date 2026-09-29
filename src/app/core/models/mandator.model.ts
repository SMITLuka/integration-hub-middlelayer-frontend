import { AdditionalDataEntry } from './additional-data.model';
import { CompanySummary } from './company.model';

/** Row shape for the Mandators list screen. */
export interface MandatorSummary {
  id: number;
  name: string;
  system: string | null;
  personalIdentificationNumber: string | null;
  externalMandatorId: string | null;
  hostUrl: string | null;
  port: number | null;
  country: string | null;
  locale: string | null;
  companyCount: number;
}

/** Full detail shape for the Mandator "View Details" screen. */
export interface MandatorDetail {
  id: number;
  name: string;
  system: string | null;
  personalIdentificationNumber: string | null;
  externalMandatorId: string | null;
  hostUrl: string | null;
  port: number | null;
  country: string | null;
  locale: string | null;
  additionalData: AdditionalDataEntry[];
  companies: CompanySummary[];
}

/** Request body for creating a Mandator. */
export interface MandatorCreateRequest {
  name: string;
  system?: string | null;
  personalIdentificationNumber?: string | null;
  externalMandatorId?: string | null;
  hostUrl?: string | null;
  port?: number | null;
  country?: string | null;
  locale?: string | null;
}

/** Request body for updating a Mandator's own fields (Additional Data is managed separately). */
export type MandatorUpdateRequest = MandatorCreateRequest;
