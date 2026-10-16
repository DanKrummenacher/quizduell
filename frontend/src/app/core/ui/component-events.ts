/**
 * Values of `@css-ch/components` events, which carry the new value in
 * `event.detail` (text fields, selects, switches, toggle groups).
 */

/** Text of an input, select or toggle group; empty if there is none. */
export function eventText(event: Event): string {
  const detail = (event as CustomEvent<unknown>).detail;
  return typeof detail === 'string' || typeof detail === 'number'
    ? String(detail)
    : '';
}

/** State of a switch. */
export function eventChecked(event: Event): boolean {
  return (event as CustomEvent<unknown>).detail === true;
}
