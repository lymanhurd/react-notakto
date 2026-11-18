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
}

export const games: GameEntry[] = [
  {
    title: 'NoTakTo',
    href: '/notakto/',
    description:
      "Tic-tac-toe where both players play X's. A board with three in a row is dead. Whoever kills the last board loses.",
    tags: ['vs. computer', 'Multiple boards'],
  },
  {
    title: 'Nim',
    href: '/nim/',
    description:
      'Take stones from one row at a time. Whoever takes the last stone wins. Learn to win every time by grouping stones into power-of-two clusters.',
    tags: ['vs. computer', 'Strategy lesson'],
  },
  {
    title: "Grundy's Game",
    href: '/grundy/',
    description:
      "Split a group of dots into two groups of different sizes. Whoever makes the last split wins. The Nim strategy works here too, once you know each group's value.",
    tags: ['vs. computer', 'Nim in disguise'],
  },
  {
    title: 'Kayles',
    href: '/kayles/',
    description:
      'Knock down one pin, or two pins side by side. Whoever knocks down the last pin wins. Another game the Nim strategy solves.',
    tags: ['vs. computer', 'Nim in disguise'],
  },
];
