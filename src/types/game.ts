/**
 * Shared type definitions for the Notakto game.
 *
 * Kept in a dedicated module so that logic.ts and monoid.ts can both
 * import from here without creating a circular dependency.
 */

// ─── Board & Cell types ───────────────────────────────────────────────────────

/**
 * A single cell on a Notakto board.
 *
 * 'X'  — mark placed in a previous turn (rendered normally)
 * 'x'  — mark placed in the most recent turn (rendered highlighted)
 * '-'  — empty cell
 */
export type Cell = 'X' | 'x' | '-';

/**
 * A 9-character string representing the full state of one board.
 * Each character is a Cell.
 *
 * Index layout:
 *
 *   0 | 1 | 2
 *   ---------
 *   3 | 4 | 5
 *   ---------
 *   6 | 7 | 8
 */
export type BoardString = string;

// ─── Player types ─────────────────────────────────────────────────────────────

/** The two participants in a Notakto game */
export type Player = 'human' | 'computer';

// ─── Game statistics ──────────────────────────────────────────────────────────

/**
 * Win/loss record tracked across sessions.
 * The "winner" in Notakto is the player who did NOT complete the last three-in-a-row.
 */
export interface GameStats {
  humanWins: number;
  computerWins: number;
}

// ─── Per-game state ───────────────────────────────────────────────────────────

/**
 * The complete state of one game of Notakto.
 *
 * @property boards      - Current state of every board in play
 * @property numBoards   - How many boards are in this game (1–3)
 * @property turn        - Whose turn it currently is
 * @property gameOver    - True once all boards have a three-in-a-row
 * @property lastWinner  - Who won the most recently completed game, if any
 */
export interface GameState {
  boards: BoardString[];
  numBoards: number;
  turn: Player;
  gameOver: boolean;
  lastWinner: Player | null;
}

// ─── Move types ───────────────────────────────────────────────────────────────

/**
 * Identifies a specific cell by board index and square number.
 *
 * @property boardIndex  - Which board (0-based)
 * @property squareNum   - Which cell within that board (0–8)
 */
export interface Move {
  boardIndex: number;
  squareNum: number;
}

// ─── Session storage ──────────────────────────────────────────────────────────

/**
 * Shape of the data persisted to sessionStorage between page reloads.
 * Mirrors GameState plus the running stats totals.
 */
export interface PersistedSession {
  gameState: GameState;
  stats: GameStats;
}
