import { useState, useRef, useEffect } from 'react';
import { Button } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import './shared/theme.css';
import './index.css';

import { computerMove, isDead, isStart, humanMove, isGameOver, winningMoves } from './logic';
import { isWinning } from './monoid';
import type { BoardString, GameStats, GameState, Player } from './types/game';
import { trackGameEnd, trackGameStart } from './shared/analytics';
import { CopyLinkButton, NextSteps } from './shared/GameParts';
import { intParam } from './shared/position';
import { getName, scoreLabel, youWon } from './shared/player';

// ---- Constants ----------------------------------------

const LINE_WIDTH = 3;
const SQUARE_WIDTH = 60;
const SQUARE_WITH_BDY = SQUARE_WIDTH + LINE_WIDTH;
const CANVAS_SIZE = 3 * SQUARE_WIDTH + 2 * LINE_WIDTH;
const X_OFFSET = 10;
const MARK_WIDTH = 5;
const SESSION_KEY = 'notaktoSession';
/** Most boards a link (?boards=N) or the "Try N boards" suggestion will set up. */
const MAX_LINKED_BOARDS = 8;
/** How long hint marks stay on the boards. */
const HINT_MS = 4000;

// ---- Session storage types ----------------------------

interface PersistedSession {
  gameState: Partial<GameState>;
  stats: GameStats;
  boards: BoardString[];
  /** Hint was pressed during the game on screen (so a win doesn't count as "without help"). */
  hintUsed?: boolean;
}

// ---- Canvas helpers ------------------------------------

function drawLine(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number,
  x1: number, y1: number
): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

/** Read a color token (e.g. '--grid') from the shared theme, with a fallback. */
function themeColor(el: Element, name: string, fallback: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

/** Size the canvas backing store for the screen's pixel density so lines stay crisp. */
function prepareCanvas(c: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  const px = Math.round(CANVAS_SIZE * dpr);
  if (c.width !== px) {
    c.width = px;
    c.height = px;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function drawBoard(c: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.strokeStyle = themeColor(c, '--grid', '#3a4152');
  ctx.lineCap = 'round';
  ctx.lineWidth = LINE_WIDTH;
  drawLine(ctx, SQUARE_WIDTH, 0, SQUARE_WIDTH, CANVAS_SIZE - 1);
  drawLine(ctx, 2 * SQUARE_WIDTH + LINE_WIDTH, 0, 2 * SQUARE_WIDTH + LINE_WIDTH, CANVAS_SIZE - 1);
  drawLine(ctx, 0, SQUARE_WIDTH, CANVAS_SIZE - 1, SQUARE_WIDTH);
  drawLine(ctx, 0, 2 * SQUARE_WIDTH + LINE_WIDTH, CANVAS_SIZE - 1, 2 * SQUARE_WIDTH + LINE_WIDTH);
}

function drawX(ctx: CanvasRenderingContext2D, moveIdx: number, clr: string): void {
  ctx.strokeStyle = clr;
  ctx.lineWidth = MARK_WIDTH;
  ctx.lineCap = 'round';
  const col = moveIdx % 3;
  const row = Math.floor((moveIdx % 9) / 3);
  drawLine(
    ctx,
    X_OFFSET + SQUARE_WITH_BDY * col, X_OFFSET + SQUARE_WITH_BDY * row,
    (SQUARE_WIDTH - X_OFFSET) + SQUARE_WITH_BDY * col,
    (SQUARE_WIDTH - X_OFFSET) + SQUARE_WITH_BDY * row
  );
  drawLine(
    ctx,
    X_OFFSET + SQUARE_WITH_BDY * col,
    (SQUARE_WIDTH - X_OFFSET) + SQUARE_WITH_BDY * row,
    (SQUARE_WIDTH - X_OFFSET) + SQUARE_WITH_BDY * col,
    X_OFFSET + SQUARE_WITH_BDY * row
  );
}

/** A small X in the middle of a square, marking a suggested move. */
function drawHintX(ctx: CanvasRenderingContext2D, moveIdx: number, clr: string): void {
  ctx.strokeStyle = clr;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const col = moveIdx % 3;
  const row = Math.floor(moveIdx / 3);
  const cx = SQUARE_WITH_BDY * col + SQUARE_WIDTH / 2;
  const cy = SQUARE_WITH_BDY * row + SQUARE_WIDTH / 2;
  const r = SQUARE_WIDTH / 7;
  drawLine(ctx, cx - r, cy - r, cx + r, cy + r);
  drawLine(ctx, cx - r, cy + r, cx + r, cy - r);
}

// ---- Small Components ----------------------------------

interface StartButtonProps {
  variant: string;
  onClick: () => void;
  startLabel: string;
}

function StartButton({ variant, onClick, startLabel }: StartButtonProps) {
  return (
    <Button variant={variant} size="lg" onClick={onClick}>
      {startLabel}
    </Button>
  );
}

interface PlusMinusButtonProps {
  onClick: () => void;
}

function MinusButton({ onClick }: PlusMinusButtonProps) {
  return (
    <Button variant="outline-primary" size="lg" onClick={onClick}>
      -
    </Button>
  );
}

function PlusButton({ onClick }: PlusMinusButtonProps) {
  return (
    <Button variant="outline-primary" size="lg" onClick={onClick}>
      +
    </Button>
  );
}

interface BoardProps {
  contents: BoardString;
  className: string;
  /** Squares to mark with a small hint X. */
  hints?: number[];
  onClick?: (event: React.MouseEvent<HTMLCanvasElement>) => void;
}

/** Re-render when the OS switches between light and dark mode (canvas colors are baked in). */
function useColorScheme(): boolean {
  const query = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  const [dark, setDark] = useState(query?.matches ?? false);
  useEffect(() => {
    if (!query) return;
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [query]);
  return dark;
}

function Board({ contents, className, onClick, hints = [] }: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dark = useColorScheme();
  const hintKey = hints.join(',');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas);
    if (!ctx) return;
    drawBoard(canvas, ctx);
    const mark = themeColor(canvas, '--mark', '#2b4c9b');
    const last = themeColor(canvas, '--last', '#d9480f');
    contents.split('').forEach((elt, idx) => {
      if (elt === 'X') {
        drawX(ctx, idx, mark);
      } else if (elt === 'x') {
        drawX(ctx, idx, last);
      }
    });
    const hintColor = themeColor(canvas, '--hint', '#2f9e44');
    hints.forEach(sq => drawHintX(ctx, sq, hintColor));
    // hintKey stands in for the hints array, which is a new object each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contents, dark, hintKey]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, display: 'block' }}
        onClick={onClick}
      >
        Your browser does not support HTML5.
      </canvas>
    </div>
  );
}

interface ScoresProps {
  humanWins: number;
  computerWins: number;
}

function Scores({ humanWins, computerWins }: ScoresProps) {
  const [name] = useState(getName);
  return (
    <div className="scoreboard" aria-live="polite">
      <div className="score">
        <span className="score-label" title={scoreLabel(name)}>{scoreLabel(name)}</span>
        <span className="score-value">{humanWins}</span>
      </div>
      <div className="score">
        <span className="score-label">Computer</span>
        <span className="score-value">{computerWins}</span>
      </div>
    </div>
  );
}

interface ResultBannerProps {
  winner: Player | null;
}

function ResultBanner({ winner }: ResultBannerProps) {
  const [name] = useState(getName);
  if (winner === 'human') {
    return (
      <div className="result-banner win" role="status">
        <strong>{youWon(name)}</strong>
        <span>The computer killed the last board.</span>
      </div>
    );
  }
  if (winner === 'computer') {
    return (
      <div className="result-banner loss" role="status">
        <strong>The computer won.</strong>
        <span>You killed the last board. Press Play Again for a rematch.</span>
      </div>
    );
  }
  return (
    <div className="result-banner" role="status">
      <strong>Game over.</strong>
    </div>
  );
}

// ---- Constants ----------------------------------------

const INITIAL_BOARDS: BoardString[] = ['---------'];
const INITIAL_STATS: GameStats = { computerWins: 0, humanWins: 0 };

// ---- Saved-game helpers (localStorage) --------------------------

const loadSession = (): PersistedSession => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { gameState: {}, stats: INITIAL_STATS, boards: INITIAL_BOARDS };
    const saved = JSON.parse(raw) as PersistedSession;
    return {
      gameState: saved.gameState ?? {},
      stats: saved.stats ?? INITIAL_STATS,
      boards: saved.boards ?? INITIAL_BOARDS,
      hintUsed: saved.hintUsed === true,
    };
  } catch {
    return { gameState: {}, stats: INITIAL_STATS, boards: INITIAL_BOARDS };
  }
};

const saveSession = (
  boards: BoardString[],
  stats: GameStats,
  lastWinner: Player | null,
  hintUsed: boolean
): void => {
  const session: PersistedSession = { gameState: { lastWinner }, stats, boards, hintUsed };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable (private mode); the game still works.
  }
};

// ---- Game component ------------------------------------

export default function Game() {
  // A link like ?boards=3 starts a fresh game with that many boards.
  const [linkedBoards] = useState(() => intParam('boards', 1, MAX_LINKED_BOARDS));

  const [boards, setBoards] = useState<BoardString[]>(() => {
    return linkedBoards ? new Array(linkedBoards).fill('---------') : loadSession().boards;
  });

  const [stats, setStats] = useState<GameStats>(() => {
    return loadSession().stats;
  });

  // Who won the game currently on screen (null while a game is in progress).
  const [lastWinner, setLastWinner] = useState<Player | null>(() => {
    return linkedBoards ? null : loadSession().gameState.lastWinner ?? null;
  });

  // Hint pressed during this game: a win then doesn't count as "without help".
  const [hintUsed, setHintUsed] = useState(() => (linkedBoards ? false : loadSession().hintUsed === true));

  useEffect(() => {
    saveSession(boards, stats, lastWinner, hintUsed);
  }, [boards, stats, lastWinner, hintUsed]);

  // The current hint: the winning squares, or 'none'. It clears itself after a few seconds.
  const [hint, setHint] = useState<{ moves: { board: number; square: number }[] } | null>(null);
  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(null), HINT_MS);
    return () => window.clearTimeout(timer);
  }, [hint]);

  function showHint() {
    setHintUsed(true);
    setHint({ moves: winningMoves(boards) });
  }

  // With an odd number of boards the first player can force a win; with an
  // even number, the second player can. The human always gets the winning side.
  const humanMovesFirst = boards.length % 2 === 1;
  const atStart = isStart(boards);
  const gameOver = isGameOver(boards);
  const waitingForStart = atStart && !humanMovesFirst;

  function handlePlus() {
    setHintUsed(false);
    setBoards(prev => [...prev, '---------']);
  }

  function handleMinus() {
    if (boards.length > 1) {
      setHintUsed(false);
      setBoards(prev => prev.slice(0, -1));
    }
  }

  const boardsLabel = (n: number) => `${n} ${n === 1 ? 'board' : 'boards'}`;

  function handleStart() {
    setHint(null);
    trackGameStart('notakto', 'computer', boardsLabel(boards.length));
    const result = computerMove(boards);
    if (result !== undefined) setBoards(result);
  }

  function handleQuit() {
    setHint(null);
    setHintUsed(false);
    // Quitting mid-game counts as a computer win; "Play Again" after a finished game doesn't.
    if (!isGameOver(boards) && !isStart(boards)) trackGameEnd('notakto', 'computer', true);
    const newBoards: BoardString[] = new Array(boards.length).fill('---------');
    setBoards(newBoards);
    setLastWinner(null);
    setStats(prev => ({
      ...prev,
      computerWins: isGameOver(boards)
        ? prev.computerWins
        : prev.computerWins + 1,
    }));
  }

  function handleBoardClick(event: React.MouseEvent<HTMLCanvasElement>, idx: number) {
    // With an even number of boards the computer must move first.
    if (waitingForStart) return;

    const squareNum =
      Math.floor(event.nativeEvent.offsetX / SQUARE_WITH_BDY) +
      3 * Math.floor(event.nativeEvent.offsetY / SQUARE_WITH_BDY);

    let newBoards = humanMove(boards, idx, squareNum);
    if (newBoards === null) return;
    setHint(null);
    if (isStart(boards)) trackGameStart('notakto', 'human', boardsLabel(boards.length));

    if (isGameOver(newBoards)) {
      setBoards(newBoards);
      setLastWinner('computer');
      trackGameEnd('notakto', 'computer');
      setStats(prev => ({ ...prev, computerWins: prev.computerWins + 1 }));
      return;
    }

    const afterComputer = computerMove(newBoards);
    if (afterComputer !== undefined) {
      newBoards = afterComputer;
    }

    if (isGameOver(newBoards)) {
      setBoards(newBoards);
      setLastWinner('human');
      trackGameEnd('notakto', 'human');
      setStats(prev => ({
        ...prev,
        humanWins: prev.humanWins + 1,
        cleanWins: (prev.cleanWins ?? 0) + (hintUsed ? 0 : 1),
      }));
      return;
    }

    setBoards(newBoards);
  }

  const buttonLabel = gameOver ? 'Play Again' : 'Quit';
  const buttonVariant = gameOver
    ? 'primary'
    : isWinning(boards) ? 'outline-danger' : 'outline-primary';

  const boardWord = boards.length === 1 ? 'board' : 'boards';
  let prompt: string;
  if (atStart) {
    prompt = humanMovesFirst
      ? `With ${boards.length} ${boardWord}, you move first. Click any square to begin.`
      : `With ${boards.length} ${boardWord}, the computer moves first. Press Start.`;
  } else {
    prompt = 'Your move. Click a square on any live board.';
  }

  return (
    <div className="game">
      <header className="game-header">
        <h1>NoTakTo</h1>
        <Scores humanWins={stats.humanWins} computerWins={stats.computerWins} />
      </header>

      <div className="controls">
        {atStart ? (
          <>
            {waitingForStart && (
              <StartButton startLabel="Start" onClick={handleStart} variant="primary" />
            )}
            <span className="board-count" aria-label="Number of boards">
              <MinusButton onClick={handleMinus} />
              <span className="board-count-value">
                {boards.length} {boards.length === 1 ? 'board' : 'boards'}
              </span>
              <PlusButton onClick={handlePlus} />
            </span>
            <CopyLinkButton values={{ boards: boards.length }} className="btn btn-outline-primary btn-lg" />
          </>
        ) : (
          <StartButton startLabel={buttonLabel} variant={buttonVariant} onClick={handleQuit} />
        )}
        {!gameOver && !waitingForStart && (
          <Button variant="outline-primary" size="lg" onClick={showHint}>
            Hint
          </Button>
        )}
      </div>

      {gameOver ? (
        <ResultBanner winner={lastWinner} />
      ) : (
        <p className="turn-prompt" role="status">{prompt}</p>
      )}
      {gameOver && (
        <NextSteps game="notakto" winner={lastWinner} helped={hintUsed} strategyHref="/discussion.html"
          harder={boards.length < MAX_LINKED_BOARDS ? {
            label: `Try ${boards.length + 1} boards`,
            onClick: () => {
              setBoards(new Array(boards.length + 1).fill('---------'));
              setLastWinner(null);
              setHint(null);
              setHintUsed(false);
            },
          } : undefined} />
      )}
      {hint && (
        <p className="hint-note" role="note">
          {hint.moves.length > 0
            ? <>Hint: playing any square marked with a small <span className="hint-x">x</span> leaves the computer
              in a losing position.</>
            : <>There is no winning move right now: whatever you play, the computer can win with perfect
              play. Make a move and hope it slips.</>}
        </p>
      )}

      <div className={waitingForStart ? 'game-board locked' : 'game-board'}>
        {boards.map((elt, idx) =>
          isDead(boards[idx]) ? (
            <Board key={idx} contents={elt} className="boards dead" />
          ) : (
            <Board
              key={idx}
              contents={elt}
              className="boards"
              hints={hint?.moves.filter(m => m.board === idx).map(m => m.square)}
              onClick={(event) => handleBoardClick(event, idx)}
            />
          )
        )}
      </div>

      <section id="explanation" className="rules-card">
        <h2>How to play</h2>
        <ul className="rules">
          <li>Players take turns, both playing X's.</li>
          <li>A board with three X's in a row (irrespective of color) is dead.</li>
          <li>Whoever kills the last board loses.</li>
          <li>With an odd number of boards you move first; with an even number, press "Start" and the computer moves first. Either way, a perfect player can always win from your side.</li>
          <li>The <span className="last-move">highlighted X</span> is the most recent move.</li>
          <li>Stuck? Press <strong>Hint</strong> to see, for a few seconds, every square that is a winning move.</li>
        </ul>
        <p className="more"><a href="/discussion.html">More discussion →</a></p>
      </section>
    </div>
  );
}
