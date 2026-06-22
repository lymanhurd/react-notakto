import { useState, useRef, useEffect } from 'react';
import { Button } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import { computerMove, isDead, isStart, humanMove, isGameOver } from './logic';
import { isWinning } from './monoid';
import type { BoardString, GameStats, GameState } from './types/game';

// ---- Constants ----------------------------------------

const LINE_WIDTH = 3;
const SQUARE_WIDTH = 60;
const SQUARE_WITH_BDY = SQUARE_WIDTH + LINE_WIDTH;
const CANVAS_SIZE = 3 * SQUARE_WIDTH + 2 * LINE_WIDTH;
const X_OFFSET = 7;
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

function drawBoard(c: HTMLCanvasElement): void {
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.strokeStyle = 'black';
  ctx.globalAlpha = 1.0;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.lineWidth = LINE_WIDTH;
  drawLine(ctx, SQUARE_WIDTH, 0, SQUARE_WIDTH, CANVAS_SIZE - 1);
  drawLine(ctx, 2 * SQUARE_WIDTH + LINE_WIDTH, 0, 2 * SQUARE_WIDTH + LINE_WIDTH, CANVAS_SIZE - 1);
  drawLine(ctx, 0, SQUARE_WIDTH, CANVAS_SIZE - 1, SQUARE_WIDTH);
  drawLine(ctx, 0, 2 * SQUARE_WIDTH + LINE_WIDTH, CANVAS_SIZE - 1, 2 * SQUARE_WIDTH + LINE_WIDTH);
}

function drawX(c: HTMLCanvasElement, moveIdx: number, clr: string): void {
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.strokeStyle = clr;
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

function Board({ contents, className, onClick }: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawBoard(canvas);
    contents.split('').forEach((elt, idx) => {
      if (elt === 'X') {
        drawX(canvas, idx, 'blue');
      } else if (elt === 'x') {
        drawX(canvas, idx, 'red');
      }
    });
  }, [contents]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className={className}
      onClick={onClick}
    >
      Your browser does not support HTML5.
    </canvas>
  );
}

interface ScoresProps {
  humanWins: number;
  computerWins: number;
}

function Scores({ humanWins, computerWins }: ScoresProps) {
  return (
    <span>
      <span className="scores">Human: {humanWins} </span>
      <span className="scores">Computer: {computerWins}</span>
    </span>
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

const saveSession = (boards: BoardString[], stats: GameStats): void => {
  const session: PersistedSession = { gameState: {}, stats, boards };
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

  useEffect(() => {
    saveSession(boards, stats);
  }, [boards, stats]);

  function handlePlus() {
    setBoards(prev => [...prev, '---------']);
  }

  function handleMinus() {
    if (boards.length > 1) {
      setBoards(prev => prev.slice(0, -1));
    }
  }

  function handleStart() {
    const result = computerMove(boards);
    if (result !== undefined) setBoards(result);
  }

  function handleQuit() {
    const newBoards: BoardString[] = new Array(boards.length).fill('---------');
    setBoards(newBoards);
    setStats(prev => ({
      ...prev,
      computerWins: isGameOver(boards)
        ? prev.computerWins
        : prev.computerWins + 1,
    }));
  }

  function handleBoardClick(event: React.MouseEvent<HTMLCanvasElement>, idx: number) {
    const squareNum =
      Math.floor(event.nativeEvent.offsetX / SQUARE_WITH_BDY) +
      3 * Math.floor(event.nativeEvent.offsetY / SQUARE_WITH_BDY);

    let newBoards = humanMove(boards, idx, squareNum);
    if (newBoards === null) return;

    if (isGameOver(newBoards)) {
      setBoards(newBoards);
      setStats(prev => ({ ...prev, computerWins: prev.computerWins + 1 }));
      return;
    }

    const afterComputer = computerMove(newBoards);
    if (afterComputer !== undefined) {
      newBoards = afterComputer;
    }

    if (isGameOver(newBoards)) {
      setBoards(newBoards);
      setStats(prev => ({ ...prev, humanWins: prev.humanWins + 1 }));
      return;
    }

    setBoards(newBoards);
  }

  const buttonLabel = isGameOver(boards) ? 'Play Again' : 'Quit';
  const buttonVariant =
    isWinning(boards) && !isGameOver(boards) ? 'outline-danger' : 'outline-primary';

  return (
    <div>
      <div className="gameHeader">
        <Scores humanWins={stats.humanWins} computerWins={stats.computerWins} />
        <a href="http://www.hurd-sullivan.com/">
          <img id="hslogo" src="images/HS.gif" alt="Go to Hurd-Sullivan.com" />
        </a>
      </div>
      <div className="game-board">
        {isStart(boards) ? (
          <div>
            <StartButton startLabel="Start" onClick={handleStart} variant="outline-primary" />
            <PlusButton onClick={handlePlus} />
            <MinusButton onClick={handleMinus} />
          </div>
        ) : (
          <div>
            <StartButton startLabel={buttonLabel} variant={buttonVariant} onClick={handleQuit} />
          </div>
        )}
        <div>
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
      </div>
      <div id="explanation">
        <ul className="rules">
          <li>Players take turns both playing X's</li>
          <li>A board with three X's in a row (irrespective of color) is dead</li>
          <li>Whoever kills the last board, loses</li>
          <li>Press "Start" to make the computer move first, or click on a square</li>
          <li><a href="./discussion.html">More discussion</a></li>
        </ul>
      </div>
    </div>
  );
}
