/** The data type a Configuration Template entry's value is expected to hold, mirroring the backend enum. */
export type ConfigValueType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'JSON';

/** All `ConfigValueType` values, in the order shown in the Type select. */
export const CONFIG_VALUE_TYPES: ConfigValueType[] = ['TEXT', 'NUMBER', 'BOOLEAN', 'JSON'];

/** One configuration key definition within a Configuration Template. */
export interface ConfigurationTemplateEntry {
  id?: number | null;
  key: string;
  type: ConfigValueType;
  defaultValue: string | null;
  expression: string | null;
  description: string | null;
  sortOrder?: number | null;
}

/** Full shape of an Interface's Configuration Template, as returned by the backend. */
export interface ConfigurationTemplate {
  id: number;
  entries: ConfigurationTemplateEntry[];
}

/** Request body for creating or fully replacing an Interface's Configuration Template. */
export interface ConfigurationTemplateUpsertRequest {
  entries: ConfigurationTemplateEntry[];
}
