import { useState, useRef, useEffect } from 'react';
import { Button } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import './shared/theme.css';
import './index.css';

import { computerMove, isDead, isStart, humanMove, isGameOver } from './logic';
import { isWinning } from './monoid';
import type { BoardString, GameStats, GameState, Player } from './types/game';
import { trackGameEnd, trackGameStart } from './shared/analytics';

// ---- Constants ----------------------------------------

const LINE_WIDTH = 3;
const SQUARE_WIDTH = 60;
const SQUARE_WITH_BDY = SQUARE_WIDTH + LINE_WIDTH;
const CANVAS_SIZE = 3 * SQUARE_WIDTH + 2 * LINE_WIDTH;
const X_OFFSET = 10;
const MARK_WIDTH = 5;
const SESSION_KEY = 'notaktoSession';

// ---- Session storage types ----------------------------

interface PersistedSession {
  gameState: Partial<GameState>;
  stats: GameStats;
  boards: BoardString[];
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

function Board({ contents, className, onClick }: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dark = useColorScheme();

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
  }, [contents, dark]);

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
  return (
    <div className="scoreboard" aria-live="polite">
      <div className="score">
        <span className="score-label">Human</span>
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
  if (winner === 'human') {
    return (
      <div className="result-banner win" role="status">
        <strong>You won!</strong>
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

// ---- Session storage helpers --------------------------

const loadSession = (): PersistedSession => {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return { gameState: {}, stats: INITIAL_STATS, boards: INITIAL_BOARDS };
  try {
    const saved = JSON.parse(raw) as PersistedSession;
    return {
      gameState: saved.gameState ?? {},
      stats: saved.stats ?? INITIAL_STATS,
      boards: saved.boards ?? INITIAL_BOARDS,
    };
  } catch {
    return { gameState: {}, stats: INITIAL_STATS, boards: INITIAL_BOARDS };
  }
};

const saveSession = (
  boards: BoardString[],
  stats: GameStats,
  lastWinner: Player | null
): void => {
  const session: PersistedSession = { gameState: { lastWinner }, stats, boards };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

// ---- Game component ------------------------------------

export default function Game() {
  const [boards, setBoards] = useState<BoardString[]>(() => {
    return loadSession().boards;
  });

  const [stats, setStats] = useState<GameStats>(() => {
    return loadSession().stats;
  });

  // Who won the game currently on screen (null while a game is in progress).
  const [lastWinner, setLastWinner] = useState<Player | null>(() => {
    return loadSession().gameState.lastWinner ?? null;
  });

  useEffect(() => {
    saveSession(boards, stats, lastWinner);
  }, [boards, stats, lastWinner]);

  // With an odd number of boards the first player can force a win; with an
  // even number, the second player can. The human always gets the winning side.
  const humanMovesFirst = boards.length % 2 === 1;
  const atStart = isStart(boards);
  const gameOver = isGameOver(boards);
  const waitingForStart = atStart && !humanMovesFirst;

  function handlePlus() {
    setBoards(prev => [...prev, '---------']);
  }

  function handleMinus() {
    if (boards.length > 1) {
      setBoards(prev => prev.slice(0, -1));
    }
  }

  const boardsLabel = (n: number) => `${n} ${n === 1 ? 'board' : 'boards'}`;

  function handleStart() {
    trackGameStart('notakto', 'computer', boardsLabel(boards.length));
    const result = computerMove(boards);
    if (result !== undefined) setBoards(result);
  }

  function handleQuit() {
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
      setStats(prev => ({ ...prev, humanWins: prev.humanWins + 1 }));
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
          </>
        ) : (
          <StartButton startLabel={buttonLabel} variant={buttonVariant} onClick={handleQuit} />
        )}
      </div>

      {gameOver ? (
        <ResultBanner winner={lastWinner} />
      ) : (
        <p className="turn-prompt" role="status">{prompt}</p>
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
        </ul>
        <p className="more"><a href="/discussion.html">More discussion →</a></p>
      </section>
    </div>
  );
}
