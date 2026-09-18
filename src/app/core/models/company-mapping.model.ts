import { CompanyMappingSummary } from './company.model';

/** Re-exported for convenience so callers only need to import from this model file. */
export type { CompanyMappingSummary };

/** Where a Company Mapping row's effective value currently comes from. */
export type MappingSourceLevel = 'OVERRIDE' | 'TEMPLATE';

/** A Mapping Template row's effective value for one Company Mapping, with its resolution source. */
export interface ResolvedMappingRow {
  templateRowId: number;
  descriptor: string;
  effectiveValue: string | null;
  sourceLevel: MappingSourceLevel;
  valueId: number | null;
}

/** A Mapping Template section's rows, resolved to their effective values for one Company Mapping. */
export interface CompanyMappingSection {
  sectionId: number;
  name: string;
  rows: ResolvedMappingRow[];
}

/** Full detail shape for one Company's Mapping instance of an Interface. */
export interface CompanyMappingDetail {
  id: number;
  interfaceId: number;
  interfaceName: string;
  sections: CompanyMappingSection[];
}

/** Request body for instantiating an Interface's Mapping Template on a Company. */
export interface CompanyMappingCreateRequest {
  interfaceId: number;
}
