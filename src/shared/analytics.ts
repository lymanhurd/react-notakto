/**
 * Umami analytics helpers.
 *
 * The Umami script is added to every page at build time (see vite.config.ts) and
 * only records visits on lymanslogicgames.com. Page views are automatic. Clicks on
 * any element with a `data-umami-event` attribute are recorded automatically too
 * (the store links use this). Game events go through `track()` below.
 *
 * When the script isn't loaded (local dev, tests, blocked by the browser),
 * every call here quietly does nothing.
 */

type EventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: EventData) => void };
  }
}

export function track(event: string, data?: EventData): void {
  try {
    window.umami?.track(event, data);
  } catch {
    // Analytics must never break a game.
  }
}

/** A game began: who moved first, and a short description of the starting position. */
export function trackGameStart(game: string, first: 'human' | 'computer', board: string): void {
  track('game-start', { game, first, board });
}

/** A game finished (or was quit, which counts as a computer win). */
export function trackGameEnd(game: string, winner: 'human' | 'computer', quit = false): void {
  track('game-end', quit ? { game, winner, quit } : { game, winner });
}
