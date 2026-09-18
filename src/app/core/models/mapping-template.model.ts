/** One field-mapping row (Descriptor / Third Party Value) within a Mapping Template Section. */
export interface MappingTemplateRow {
  id?: number | null;
  descriptor: string;
  thirdPartyValue: string | null;
  sortOrder?: number | null;
}

/** A named group of mapping rows within a Mapping Template. */
export interface MappingTemplateSection {
  id?: number | null;
  name: string;
  sortOrder?: number | null;
  rows: MappingTemplateRow[];
}

/** Full shape of an Interface's Mapping Template, as returned by the backend. */
export interface MappingTemplate {
  id: number;
  sections: MappingTemplateSection[];
}

/** Request body for creating or fully replacing an Interface's Mapping Template. */
export interface MappingTemplateUpsertRequest {
  sections: MappingTemplateSection[];
}
