/**
 * Lyman's Logic Games store on Teachers Pay Teachers (worksheets for the games).
 * The utm_ tags mark visits as coming from this site, for any referral reports.
 */
export const STORE_URL =
  'https://www.teacherspayteachers.com/store/lymans-logic-games?utm_source=lymanslogicgames.com&utm_medium=website';

/** Umami click-event attributes for a store link; `location` says which link was clicked. */
export function storeClickAttrs(location: string) {
  return { 'data-umami-event': 'store-click', 'data-umami-event-location': location };
}

/** Public contact address shown in the Contact section and footer. */
export const CONTACT_EMAIL = 'lyman@lymanslogicgames.com';

/** Umami click-event attributes for a contact (mailto) link. */
export function contactClickAttrs(location: string) {
  return { 'data-umami-event': 'contact-click', 'data-umami-event-location': location };
}
