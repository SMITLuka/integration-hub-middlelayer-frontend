/**
 * A single key-value Additional Data entry with no inheritance concept
 * (Mandator-level additional data).
 */
export interface AdditionalDataEntry {
  key: string;
  value: string;
}

/** Where a resolved Company Additional Data value currently comes from. */
export type AdditionalDataSourceLevel = 'COMPANY' | 'MANDATOR';

/**
 * A single resolved Company Additional Data entry, indicating whether the
 * effective value is the Company's own override or inherited from its Mandator.
 */
export interface ResolvedAdditionalDataEntry {
  key: string;
  value: string;
  sourceLevel: AdditionalDataSourceLevel;
}
