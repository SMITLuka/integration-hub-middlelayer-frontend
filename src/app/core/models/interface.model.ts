import { AdditionalDataEntry } from './additional-data.model';

/** Row shape for the Interfaces list screen. */
export interface InterfaceSummary {
  id: number;
  uuid: string;
  name: string;
  hasMappingTemplate: boolean;
  hasConfigurationTemplate: boolean;
}

/** One Mandator/Company pair that has instantiated an Interface's Mapping or Configuration Template. */
export interface InterfaceUsage {
  mandatorId: number;
  mandatorName: string;
  companyId: number;
  companyName: string;
  updatedAt: string;
}

/** The Mandator/Company pairs currently using an Interface, split by Mapping vs Configuration usage. */
export interface InterfaceUsages {
  mappingUsages: InterfaceUsage[];
  configurationUsages: InterfaceUsage[];
}

/** Full detail shape for the Interface "View Details" screen. */
export interface InterfaceDetail {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  additionalData: AdditionalDataEntry[];
  hasMappingTemplate: boolean;
  hasConfigurationTemplate: boolean;
  usages: InterfaceUsages;
}

/** Request body for creating an Interface. */
export interface InterfaceCreateRequest {
  name: string;
  description?: string | null;
}

/** Request body for updating an Interface's own fields (Additional Data is managed separately). */
export type InterfaceUpdateRequest = InterfaceCreateRequest;
