import { useState } from 'react';
import {
  applyMove,
  biteSize,
  clampSize,
  computerMove,
  hasSquare,
  inBite,
  isGameOver,
  isPoison,
  label,
  MAX_COLS,
  MAX_ROWS,
  MIN_COLS,
  MIN_ROWS,
  PRESETS,
  randomSize,
  rectangle,
  sizeLabel,
  winningMoves,
} from './logic';
import type { Bite, Board, Size } from './logic';
import { BoardDescription, CopyLinkButton, NextSteps, ResultBanner, Scoreboard } from '../shared/GameParts';
import { useBoardNav } from '../shared/useBoardNav';
import { keyboardFocus } from '../shared/keyboardFocus';
import { useBoardDescription } from '../shared/useBoardDescription';
import { usePlayAgainFocus } from '../shared/usePlayAgainFocus';
import { intParam } from '../shared/position';
import { load, save } from '../shared/storage';
import { useTurnGame } from '../shared/useTurnGame';

const PREFS_KEY = 'chompPrefs';

/** A link like ?rows=4&cols=7 sets the size of the bar. */
function linked(p: Prefs): Prefs {
  const rows = intParam('rows', MIN_ROWS, MAX_ROWS);
  const cols = intParam('cols', MIN_COLS, MAX_COLS);
  return rows !== null && cols !== null ? { ...p, size: { rows, cols } } : p;
}

/** A slightly bigger bar to try after a win, or null at the largest size. */
function bigger({ rows, cols }: Size): Size | null {
  if (cols < MAX_COLS) return { rows, cols: cols + 1 };
  if (rows < MAX_ROWS) return { rows: rows + 1, cols };
  return null;
}

interface Prefs {
  size: Size;
  /** Show the position's label, as in the one-pager's lookup table. */
  showLabel: boolean;
}

const squaresWord = (n: number) => (n === 1 ? 'square' : 'squares');
const where = (b: Bite) => `row ${b.row + 1}, column ${b.col + 1}`;

export default function ChompGame() {
  const [prefs, setPrefsState] = useState<Prefs>(() =>
    linked(load(PREFS_KEY, { size: { rows: 4, cols: 7 }, showLabel: false })));
  const setPrefs = (p: Prefs) => {
    setPrefsState(p);
    save(PREFS_KEY, p);
  };
  const size = clampSize(prefs.size);

  const game = useTurnGame<Board, Bite>({
    initial: rectangle(size),
    apply: applyMove,
    isOver: isGameOver,
    computerMove,
    statsKey: 'chompStats',
    game: 'chomp',
    describeStart: board => sizeLabel({ rows: board.length, cols: board[0] }),
    helpersOn: prefs.showLabel,
  });
  const board = game.state;

  const [hover, setHover] = useState<Bite | null>(null);
  const [hint, setHint] = useState<Bite | 'none' | null>(null);
  // The board the computer bit into, to say how much it took.
  const [computerFrom, setComputerFrom] = useState<Board>(board);

  function play(bite: Bite) {
    setHover(null);
    setHint(null);
    setComputerFrom(applyMove(board, bite));
    game.playHuman(bite);
  }

  function restart(next: Size) {
    const s = clampSize(next);
    setPrefs({ ...prefs, size: s });
    setHover(null);
    setHint(null);
    game.reset(rectangle(s));
  }

  function showHint() {
    game.markHint();
    const wins = winningMoves(board);
    setHint(wins.length > 0 ? wins[0] : 'none');
  }

  const preview = game.humanToMove ? hover : null;
  const hintBite = hint && hint !== 'none' ? hint : null;

  let prompt: string;
  if (game.pending) {
    const n = biteSize(board, game.pending);
    prompt = `The computer is biting at ${where(game.pending)}: ${n} ${squaresWord(n)}…`;
  } else if (preview) {
    const n = biteSize(board, preview);
    prompt = `Click to eat ${n} ${squaresWord(n)}, leaving ${label(applyMove(board, preview))}.`;
  } else if (game.phase === 'setup') {
    prompt = 'Click a square to eat it and every square above it and to its right. Or let the computer start.';
  } else if (game.lastComputerMove) {
    const n = biteSize(computerFrom, game.lastComputerMove);
    prompt = `The computer ate ${n} ${squaresWord(n)}. Your move.`;
  } else {
    prompt = 'Your move.';
  }

  const standing = board.map((n, r) => ({ n, r })).filter(({ n }) => n > 0).reverse();
  const boardText = `${standing.length} ${standing.length === 1 ? 'row' : 'rows'} of chocolate, top to bottom: ${
    standing.map(({ n, r }) => `row ${r + 1} has ${n} ${squaresWord(n)}`).join(', ')
  }. The poisoned square is at row 1, column 1 (bottom left).`;
  const { describe, spoken } = useBoardDescription(boardText);
  const boardRef = useBoardNav(describe);

  function cell(row: number, col: number) {
    const sq = { row, col };
    if (!hasSquare(board, sq)) return <span key={col} className="ch-cell eaten" aria-hidden="true" />;
    if (isPoison(sq)) {
      return (
        <span key={col} className="ch-cell poison" role="img" aria-label="Poisoned square (nailed down)">
          X
        </span>
      );
    }
    const classes = ['ch-cell', 'square'];
    if (inBite(game.pending, row, col)) classes.push('pending');
    else if (inBite(preview, row, col)) classes.push('preview');
    if (inBite(hintBite, row, col)) classes.push('hint');
    if (hintBite && hintBite.row === row && hintBite.col === col) classes.push('hint-target');
    return (
      <button
        key={col}
        type="button"
        className={classes.join(' ')}
        data-row={board.length - 1 - row}
        data-col={col}
        aria-disabled={!game.humanToMove}
        aria-label={`Bite at ${where(sq)}: eats ${biteSize(board, sq)} ${squaresWord(biteSize(board, sq))}${
          hintBite && hintBite.row === row && hintBite.col === col ? ', hint' : ''}`}
        onMouseEnter={() => setHover(sq)}
        onMouseLeave={() => setHover(null)}
        onFocus={e => keyboardFocus(e.currentTarget) && setHover(sq)}
        onBlur={() => setHover(null)}
        onClick={() => game.humanToMove && play(sq)}
      />
    );
  }

  const rows = Array.from({ length: board.length }, (_, i) => board.length - 1 - i);
  const cols = Array.from({ length: size.cols }, (_, i) => i);

  const playAgainRef = usePlayAgainFocus(game.phase);

  return (
    <div className="chomp">
      <header className="game-header">
        <h1>Chomp</h1>
        <Scoreboard stats={game.stats} />
      </header>

      <section className="play-setup" aria-label="Choose a chocolate bar">
        <div className="preset-list">
          {PRESETS.map(p => {
            const active = p.rows === size.rows && p.cols === size.cols;
            return (
              <button key={p.label} type="button" className={`preset${active ? ' active' : ''}`}
                aria-pressed={active} onClick={() => restart(p)}>
                <span className="preset-rows">{sizeLabel(p)}</span>
                <span className="preset-label">{p.label}</span>
              </button>
            );
          })}
          <button type="button" className="preset" onClick={() => restart(randomSize())}>
            <span className="preset-rows">? × ?</span>
            <span className="preset-label">Random</span>
          </button>
        </div>
        <div className="play-controls ch-size">
          <span className="size-stepper" aria-label="Rows">
            <button type="button" className="btn-theme" aria-label="Fewer rows"
              disabled={size.rows <= MIN_ROWS} onClick={() => restart({ ...size, rows: size.rows - 1 })}>−</button>
            <span className="size-value">{size.rows} {size.rows === 1 ? 'row' : 'rows'}</span>
            <button type="button" className="btn-theme" aria-label="More rows"
              disabled={size.rows >= MAX_ROWS} onClick={() => restart({ ...size, rows: size.rows + 1 })}>+</button>
          </span>
          <span className="size-stepper" aria-label="Columns">
            <button type="button" className="btn-theme" aria-label="Fewer columns"
              disabled={size.cols <= MIN_COLS} onClick={() => restart({ ...size, cols: size.cols - 1 })}>−</button>
            <span className="size-value">{size.cols} columns</span>
            <button type="button" className="btn-theme" aria-label="More columns"
              disabled={size.cols >= MAX_COLS} onClick={() => restart({ ...size, cols: size.cols + 1 })}>+</button>
          </span>
        </div>
      </section>

      <div className="play-controls">
        {game.phase === 'setup' && (
          <>
            <button type="button" className="btn-theme primary" onClick={() => {
              setComputerFrom(board);
              game.computerFirst();
            }}>
              Computer moves first
            </button>
            <CopyLinkButton values={{ rows: size.rows, cols: size.cols }} />
          </>
        )}
        {game.phase !== 'over' && (
          <button type="button" className="btn-theme" onClick={showHint} disabled={!game.humanToMove}>
            Hint
          </button>
        )}
        {game.phase !== 'setup' && (
          <button ref={playAgainRef} type="button" className={`btn-theme${game.phase === 'over' ? ' primary' : ''}`}
            onClick={() => restart(size)}>
            {game.phase === 'over' ? 'Play again' : 'Restart'}
          </button>
        )}
        <span className="toggles">
          <label>
            <input type="checkbox" checked={prefs.showLabel}
              onChange={e => setPrefs({ ...prefs, showLabel: e.target.checked })} />
            Show position label
          </label>
        </span>
      </div>

      {game.phase === 'over' ? (
        <ResultBanner winner={game.winner} win="You ate the last good square. The poison is left for the computer!"
          loss="It ate the last good square, leaving you the poison. Try again!" />
      ) : (
        <p className="turn-prompt" role="status">{prompt}</p>
      )}
      {game.phase === 'over' && (() => {
        const next = bigger(size);
        return (
          <NextSteps game="chomp" winner={game.winner} helped={game.helpedWin} strategyHref="#strategy"
            harder={next ? { label: `Try a ${sizeLabel(next)} bar`, onClick: () => restart(next) } : undefined} />
        );
      })()}
      {hint === 'none' && (
        <p className="hint-note">
          There is no winning bite from here. Nibble a single corner square and wait for the computer to slip.
        </p>
      )}
      {hintBite && (
        <p className="hint-note">
          Hint: bite at <strong>{where(hintBite)}</strong> (the glowing squares), leaving{' '}
          {label(applyMove(board, hintBite))}.
        </p>
      )}

      <BoardDescription id="chomp-board-text" text={boardText} spoken={spoken} onDescribe={describe} />
      <div className="play-board ch-board-card">
        <div ref={boardRef} className="ch-board" role="group" aria-label="Chocolate bar"
          aria-describedby="chomp-board-text" data-board
          style={{ '--cols': size.cols } as React.CSSProperties}>
          {rows.map(row => (
            <div key={row} className="ch-row" role="group" aria-label={`Row ${row + 1}`}>
              {cols.map(col => cell(row, col))}
            </div>
          ))}
        </div>
        {prefs.showLabel && (
          <p className="ch-label">
            Position <strong>{label(board)}</strong>
            <span>row lengths, top to bottom</span>
          </p>
        )}
      </div>

      <section className="rules-card">
        <h2>How to play</h2>
        <ul className="rules">
          <li>The board is a chocolate bar. On your turn, <strong>chomp</strong> one square: you eat it and <strong>every square above it or to its right</strong>.</li>
          <li>The lower left square (X) is <strong>poisoned</strong>. It is nailed to the table, so nobody can eat it.</li>
          <li>Whoever eats the <strong>last good square wins</strong>, leaving the other player stuck with the poison.</li>
        </ul>
      </section>

      <section id="strategy" className="rules-card strategy-card">
        <h2>Things we know</h2>
        <ul className="rules">
          <li>On a full rectangle the <strong>first player can always win</strong>. If the second player had a winning plan, the first player could steal it by eating just the top right square, since any reply would leave a board the first player could have made in one bite. This proves a winning move exists without saying what it is!</li>
          <li>On a <strong>square</strong> board, eat everything except the bottom row and left column. That leaves an L with two equal arms. Then copy each of your opponent's bites on the other arm.</li>
          <li>On a board with <strong>two rows</strong>, try to keep the bottom row exactly one square longer than the top row.</li>
          <li>Three rows were solved by a high school student, and for four or more rows nobody knows a simple rule. The computer simply searches every position it could reach.</li>
          <li>On the 4 × 7 bar, start by eating the 2 × 4 block in the upper right, leaving (3, 3, 7, 7). Turn on <strong>Show position label</strong> to follow along with the lookup table.</li>
        </ul>
      </section>
    </div>
  );
}
