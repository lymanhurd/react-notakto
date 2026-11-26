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

export interface NextGame {
  title: string;
  href: string;
  /** One short line on why to try it. */
  pitch: string;
}

/**
 * The game to suggest when each game ends: the same order as the front page.
 * Nim → Silver Dollar → Wythoff's Nim → Kayles → Grundy's Game → Chomp → Misère Nim → NoTakTo → Nim.
 */
export const NEXT_GAME: Record<string, NextGame> = {
  nim: { title: 'Silver Dollar Game', href: '/silver/', pitch: 'Slide coins, and watch the gaps turn into Nim piles.' },
  silver: { title: "Wythoff's Nim", href: '/wythoff/', pitch: 'Nim with a twist: you can take from both piles at once.' },
  wythoff: { title: 'Kayles', href: '/kayles/', pitch: 'Knock down pins: each run of pins has its own Nim value.' },
  kayles: { title: "Grundy's Game", href: '/grundy/', pitch: 'Simple rules, and nobody knows whether its values ever repeat.' },
  grundy: { title: 'Chomp', href: '/chomp/', pitch: "Eat the chocolate bar, but don't take the poisoned square." },
  chomp: { title: 'Misère Nim', href: '/misere-nim/', pitch: 'Nim where taking the last stone loses. What changes?' },
  'misere-nim': { title: 'NoTakTo', href: '/notakto/', pitch: 'Tic-tac-toe where both players are X, and the last move loses.' },
  notakto: { title: 'Nim', href: '/nim/', pitch: 'The classic: learn the strategy behind many of these games.' },
};

/** Umami click-event attributes for an end-of-game next step. */
export function nextStepAttrs(game: string, kind: 'harder' | 'strategy' | 'next-game') {
  return { 'data-umami-event': 'next-step-click', 'data-umami-event-game': game, 'data-umami-event-kind': kind };
}
