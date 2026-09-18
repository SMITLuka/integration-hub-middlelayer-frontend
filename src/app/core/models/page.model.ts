/**
 * Shape of a Spring Data `Page<T>` response, as returned by paginated list endpoints.
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
