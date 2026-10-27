/** Value returned by every Server Action: either data or a user-facing error. */
export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function fail<T>(error: string): ActionResult<T> {
  return { data: null, error };
}
