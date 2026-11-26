// The catalog of games shown on the landing page.
// To add a game: add an entry here, plus an `<name>/index.html` entry point
// (registered in vite.config.ts) that mounts the game.

export interface GameEntry {
  /** Short name shown as the card title. */
  title: string;
  /** Path the card links to (served from dist/<path>/index.html). */
  href: string;
  /** One or two sentences describing the game. */
  description: string;
  /** Optional small tags, e.g. "Impartial game", "vs. computer". */
  tags?: string[];
  /** localStorage key holding this game's score (see src/shared/player.ts). */
  statsKey: string;
  /** What counts as help: a win with none of these is a "win without help". */
  helpers: string[];
}

// Listed in the suggested order to learn them:
// 1. Nim, then two games that turn into Nim with a simple formula (Silver Dollar, Wythoff's Nim).
// 2. Games whose positions can be computed, though a closed formula for each value is less
//    obvious (Kayles, Grundy's Game, Chomp).
// 3. Misère play, where the last move loses (Misère Nim, then NoTakTo).
export const games: GameEntry[] = [
  {
    title: 'Nim',
    href: '/nim/',
    statsKey: 'nimStats',
    helpers: ['Hint', 'Show clusters', 'Show tally'],
    description:
      'Take stones from one row at a time. Whoever takes the last stone wins. Learn to win every time by grouping stones into power-of-two clusters.',
    tags: ['vs. computer', 'Strategy lesson'],
  },
  {
    title: 'Silver Dollar Game',
    href: '/silver/',
    statsKey: 'silverStats',
    helpers: ['Hint', 'Show gaps'],
    description:
      "John Conway's coin-sliding game. Slide a coin toward the star; whoever makes the last move wins. Turn on the Nim view to see every other gap become a Nim pile.",
    tags: ['vs. computer', 'Nim in disguise'],
  },
  {
    title: "Wythoff's Nim",
    href: '/wythoff/',
    statsKey: 'wythoffStats',
    helpers: ['Hint', 'Mark special squares'],
    description:
      'Take any number of stones from one pile, or the same number from both. Play it on two piles or as a grid, and look for the pattern in the special squares.',
    tags: ['vs. computer', 'Two views'],
  },
  {
    title: 'Kayles',
    href: '/kayles/',
    statsKey: 'kaylesStats',
    helpers: ['Hint', 'Show values', 'Show tally'],
    description:
      'Knock down one pin, or two pins side by side. Whoever knocks down the last pin wins. Another game the Nim strategy solves.',
    tags: ['vs. computer', 'Nim in disguise'],
  },
  {
    title: "Grundy's Game",
    href: '/grundy/',
    statsKey: 'grundyStats',
    helpers: ['Hint', 'Show values', 'Show tally'],
    description:
      "Split a group of dots into two groups of different sizes. Whoever makes the last split wins. The Nim strategy works here too, once you know each group's value.",
    tags: ['vs. computer', 'Nim in disguise'],
  },
  {
    title: 'Chomp',
    href: '/chomp/',
    statsKey: 'chompStats',
    helpers: ['Hint', 'Show position label'],
    description:
      'Take turns biting a chocolate bar: each bite eats a square and everything above it and to its right. Eat the last good square and leave your opponent the poisoned one.',
    tags: ['vs. computer', 'Strategy stealing'],
  },
  {
    title: 'Misère Nim',
    href: '/misere-nim/',
    statsKey: 'misereNimStats',
    helpers: ['Hint', 'Show clusters', 'Show tally'],
    description:
      'Nim turned upside down: whoever takes the last stone loses. The Nim strategy still works, right up until the very end. Find the one moment where it changes.',
    tags: ['vs. computer', 'Misère play'],
  },
  {
    title: 'NoTakTo',
    href: '/notakto/',
    statsKey: 'notaktoSession',
    helpers: ['Hint'],
    description:
      "Tic-tac-toe where both players play X's. A board with three in a row is dead. Whoever kills the last board loses.",
    tags: ['vs. computer', 'Multiple boards'],
  },
];
