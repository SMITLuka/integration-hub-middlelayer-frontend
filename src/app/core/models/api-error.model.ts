/** A single field-level validation failure, embedded in an ErrorDetail's fieldErrors list. */
export interface FieldErrorDetail {
  field: string;
  message: string;
}

/** Error detail embedded inside an ErrorResponse. */
export interface ErrorDetail {
  code: string;
  description: string;
  fieldErrors?: FieldErrorDetail[];
}

/** Standard error response envelope returned by the middlelayer on any 4xx/5xx. */
export interface ErrorResponse {
  error: ErrorDetail;
}
