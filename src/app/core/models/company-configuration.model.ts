import { ConfigValueType } from './configuration-template.model';
import { CompanyConfigurationSummary } from './company.model';

/** Re-exported for convenience so callers only need to import from this model file. */
export type { CompanyConfigurationSummary };

/**
 * Where a Company Configuration entry's effective value currently comes from,
 * in cascade priority order (OVERRIDE wins, TEMPLATE is the fallback default).
 */
export type ConfigSourceLevel = 'OVERRIDE' | 'COMPANY' | 'MANDATOR' | 'TEMPLATE';

/** A Configuration Template entry's effective value for one Company Configuration, with its resolution source. */
export interface ResolvedConfigEntry {
  templateEntryId: number;
  key: string;
  type: ConfigValueType;
  description: string | null;
  effectiveValue: string | null;
  sourceLevel: ConfigSourceLevel;
  overrideId: number | null;
}

/** Full detail shape for one Company's Configuration instance of an Interface. */
export interface CompanyConfigurationDetail {
  id: number;
  interfaceId: number;
  interfaceName: string;
  entries: ResolvedConfigEntry[];
}

/** Request body for instantiating an Interface's Configuration Template on a Company. */
export interface CompanyConfigurationCreateRequest {
  interfaceId: number;
}
