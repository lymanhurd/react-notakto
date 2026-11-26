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

/** The game to suggest when each game ends, so players move along a path through the site. */
export const NEXT_GAME: Record<string, NextGame> = {
  nim: { title: 'Kayles', href: '/kayles/', pitch: 'Kayles is Nim in disguise: the same trick wins it.' },
  kayles: { title: "Grundy's Game", href: '/grundy/', pitch: 'Another game the Nim strategy solves.' },
  grundy: { title: 'Silver Dollar Game', href: '/silver/', pitch: 'Slide coins, and watch the gaps turn into Nim piles.' },
  silver: { title: "Wythoff's Nim", href: '/wythoff/', pitch: 'Nim with a twist: you can take from both piles at once.' },
  wythoff: { title: 'Chomp', href: '/chomp/', pitch: "Eat the chocolate bar, but don't take the poisoned square." },
  chomp: { title: 'NoTakTo', href: '/notakto/', pitch: 'Tic-tac-toe where both players are X.' },
  notakto: { title: 'Nim', href: '/nim/', pitch: 'The classic: learn the strategy behind many of these games.' },
};

/** Umami click-event attributes for an end-of-game next step. */
export function nextStepAttrs(game: string, kind: 'harder' | 'strategy' | 'next-game') {
  return { 'data-umami-event': 'next-step-click', 'data-umami-event-game': game, 'data-umami-event-kind': kind };
}
