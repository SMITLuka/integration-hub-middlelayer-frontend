/** Row shape for the Companies table nested inside a Mandator detail screen. */
export interface CompanySummary {
  id: number;
  name: string;
  dmsCompanyId: string | null;
  location: string | null;
  countryCode: string | null;
}

/** Row shape for the Mappings list on a Company detail screen. */
export interface CompanyMappingSummary {
  id: number;
  interfaceId: number;
  interfaceName: string;
  updatedAt: string;
}

/** Row shape for the Configurations list on a Company detail screen. */
export interface CompanyConfigurationSummary {
  id: number;
  interfaceId: number;
  interfaceName: string;
  updatedAt: string;
}

/** Full detail shape for the Company "View Details" screen. */
export interface CompanyDetail {
  id: number;
  mandatorId: number;
  mandatorName: string;
  name: string;
  dmsCompanyId: string | null;
  location: string | null;
  address: string | null;
  countryCode: string | null;
  defaultLocale: string | null;
  mappings: CompanyMappingSummary[];
  configurations: CompanyConfigurationSummary[];
}

/** Request body for creating a Company under a Mandator. */
export interface CompanyCreateRequest {
  name: string;
  dmsCompanyId?: string | null;
  location?: string | null;
  address?: string | null;
  countryCode?: string | null;
  defaultLocale?: string | null;
}

/** Request body for updating a Company's own fields (Additional Data is managed separately). */
export type CompanyUpdateRequest = CompanyCreateRequest;
