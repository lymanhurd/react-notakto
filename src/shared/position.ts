// Links to a specific starting position, e.g. /nim/?rows=4,6,7 or /wythoff/?a=7&b=11.
// A teacher can put one on a worksheet or a slide and the whole class starts from it.

function params(): URLSearchParams {
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}

/** A whole number from the URL, or null if it's missing or outside min–max. */
export function intParam(name: string, min: number, max: number): number | null {
  const raw = params().get(name);
  if (raw === null || !/^\d+$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
}

/** A comma-separated list of whole numbers (e.g. "4,6,7"), or null if any is invalid. */
export function listParam(name: string, min: number, max: number, maxLength: number): number[] | null {
  const raw = params().get(name);
  if (raw === null) return null;
  const parts = raw.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0 || parts.length > maxLength || parts.some(p => !/^\d+$/.test(p))) return null;
  const list = parts.map(Number);
  return list.every(n => n >= min && n <= max) ? list : null;
}

/** The full address of this page set up with `values`, e.g. https://…/nim/?rows=4,6,7 */
export function positionUrl(values: Record<string, string | number>): string {
  const query = Object.entries(values)
    .map(([k, v]) => `${encodeURIComponent(k)}=${String(v).split(',').map(encodeURIComponent).join(',')}`)
    .join('&');
  return `${window.location.origin}${window.location.pathname}?${query}`;
}
