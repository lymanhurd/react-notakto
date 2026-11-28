import { useState } from 'react';
import {
  applyMove,
  computerMove,
  describeMove,
  GRID,
  isGameOver,
  isLegal,
  isP,
  MAX_PILE,
  PHI,
  randomStart,
  samePos,
  winningMoves,
} from './logic';
import type { Pos } from './logic';
import { BoardDescription, CopyLinkButton, NextSteps, ResultBanner, Scoreboard } from '../shared/GameParts';
import { useBoardNav } from '../shared/useBoardNav';
import { keyboardFocus } from '../shared/keyboardFocus';
import { useBoardDescription } from '../shared/useBoardDescription';
import { usePlayAgainFocus } from '../shared/usePlayAgainFocus';
import { intParam } from '../shared/position';
import { load, save } from '../shared/storage';
import { useTurnGame } from '../shared/useTurnGame';

const PREFS_KEY = 'wythoffPrefs';

/** A link like ?a=7&b=11 sets the starting piles. */
function linked(p: Prefs): Prefs {
  const a = intParam('a', 0, MAX_PILE);
  const b = intParam('b', 0, MAX_PILE);
  return a !== null && b !== null && a + b > 0 ? { ...p, start: { a, b } } : p;
}

type View = 'grid' | 'piles' | 'both';

interface Prefs {
  start: Pos;
  view: View;
  /** Mark the special (safe) squares and the lines through them. */
  marked: boolean;
}

const fmt = (p: Pos) => `(${p.a}, ${p.b})`;

export default function WythoffGame() {
  const [prefs, setPrefsState] = useState<Prefs>(() =>
    linked(load(PREFS_KEY, { start: { a: 7, b: 11 }, view: 'both', marked: false })));
  const setPrefs = (p: Prefs) => {
    setPrefsState(p);
    save(PREFS_KEY, p);
  };

  const game = useTurnGame<Pos, Pos>({
    initial: prefs.start,
    apply: applyMove,
    isOver: isGameOver,
    computerMove,
    statsKey: 'wythoffStats',
    game: 'wythoff',
    describeStart: fmt,
    // The marked squares only show on the grid.
    helpersOn: prefs.marked && prefs.view !== 'piles',
  });
  const pos = game.state;

  const [hover, setHover] = useState<Pos | null>(null);
  const [hint, setHint] = useState<Pos | 'none' | null>(null);
  // Where the computer's move starts (the position after the human's move), to describe it.
  const [computerFrom, setComputerFrom] = useState<Pos>(prefs.start);

  function play(to: Pos) {
    setHover(null);
    setHint(null);
    setComputerFrom(to);
    game.playHuman(to);
  }

  function restart(start: Pos) {
    setPrefs({ ...prefs, start });
    setHint(null);
    setHover(null);
    game.reset(start);
  }

  function setPile(pile: 'a' | 'b', n: number) {
    restart({ ...prefs.start, [pile]: Math.max(0, Math.min(MAX_PILE, n)) });
  }

  function showHint() {
    game.markHint();
    const wins = winningMoves(pos);
    setHint(wins.length > 0 ? wins[0] : 'none');
  }

  const preview = game.humanToMove ? hover : null;
  const hintPos = hint && hint !== 'none' ? hint : null;
  const showGrid = prefs.view !== 'piles';
  const showPiles = prefs.view !== 'grid';
  const marked = prefs.marked && showGrid;

  let prompt: string;
  if (game.pending) {
    prompt = `The computer will ${describeMove(pos, game.pending)}, moving to ${fmt(game.pending)}…`;
  } else if (preview) {
    prompt = `Click to ${describeMove(pos, preview)}, moving to ${fmt(preview)}.`;
  } else if (game.phase === 'setup') {
    prompt = 'Make a move to start, or let the computer go first.';
  } else if (game.lastComputerMove) {
    prompt = `The computer chose to ${describeMove(computerFrom, game.lastComputerMove)}. Your move.`;
  } else {
    prompt = 'Your move.';
  }

  function cellClasses(p: Pos): string {
    const classes = ['wy-cell'];
    if (marked && isP(p)) classes.push('marked');
    if (samePos(pos, p)) classes.push('here');
    else if (game.humanToMove && isLegal(pos, p)) classes.push('reach');
    if (samePos(game.pending, p)) classes.push('pending');
    else if (samePos(preview, p)) classes.push('preview');
    if (samePos(hintPos, p)) classes.push('hint');
    return classes.join(' ');
  }

  const stonesWord = (n: number) => `${n} ${n === 1 ? 'stone' : 'stones'}`;
  const boardText = `Pile A: ${stonesWord(pos.a)}. Pile B: ${stonesWord(pos.b)}. On the grid, the marker is at ${fmt(pos)}.`;
  const { describe, spoken } = useBoardDescription(boardText);
  const gridRef = useBoardNav(describe);
  const pilesRef = useBoardNav(describe);

  /** Extra words for a square or stone: the hinted move, a marked square. */
  const notes = (to: Pos) => [
    samePos(hintPos, to) ? 'hint' : '',
    marked && isP(to) ? 'special square' : '',
  ].filter(Boolean).map(n => `, ${n}`).join('');

  const rows = Array.from({ length: GRID }, (_, i) => GRID - 1 - i);
  const cols = Array.from({ length: GRID }, (_, i) => i);

  const grid = (
    <div className="play-board wy-grid-card">
      <div className="wy-grid-wrap">
        <span className="wy-axis-title y">Pile B</span>
        <div className="wy-y-labels" aria-hidden="true">
          {rows.map(b => <span key={b}>{b}</span>)}
        </div>
        <div className="wy-grid-area">
          <div ref={gridRef} className="wy-grid" role="grid" aria-label="Grid of positions"
            aria-describedby="wythoff-board-text" data-board>
            {rows.map(b => (
              <div key={b} className="wy-row" role="row">
                {cols.map(a => {
                  const p = { a, b };
                  const legal = game.phase !== 'over' && isLegal(pos, p);
                  const here = samePos(pos, p);
                  return (
                    <span key={a} role="gridcell" className={cellClasses(p)}>
                      {legal ? (
                        <button
                          type="button"
                          data-row={GRID - 1 - b}
                          data-col={a}
                          aria-disabled={!game.humanToMove}
                          aria-label={`Move to ${fmt(p)}: ${describeMove(pos, p)}${notes(p)}`}
                          onMouseEnter={() => setHover(p)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={e => keyboardFocus(e.currentTarget) && setHover(p)}
                          onBlur={() => setHover(null)}
                          onClick={() => game.humanToMove && play(p)}
                        />
                      ) : (
                        <span aria-label={here ? `Marker at ${fmt(p)}` : undefined}>
                          {here && <i className="wy-marker" />}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          {marked && (
            <svg className="wy-lines" viewBox={`0 0 ${GRID} ${GRID}`} preserveAspectRatio="none" aria-hidden="true">
              <line x1={0} y1={GRID} x2={GRID / PHI} y2={0} />
              <line x1={0} y1={GRID} x2={GRID} y2={GRID - GRID / PHI} />
            </svg>
          )}
        </div>
        <div className="wy-x-labels" aria-hidden="true">
          {cols.map(a => <span key={a}>{a}</span>)}
        </div>
        <span className="wy-axis-title x">Pile A</span>
      </div>
    </div>
  );

  // Stones are taken from the left: clicking a stone takes it and every stone to its left.
  // The move being shown (pending, previewed, or hinted) and how it's drawn.
  const shown = game.pending ?? preview ?? hintPos;
  const shownClass = game.pending ? 'pending' : preview ? 'preview' : 'hint';
  const takenFrom = (name: 'a' | 'b') => (shown ? pos[name] - shown[name] : 0);

  function stoneRow(name: 'a' | 'b', navRow: number) {
    const n = pos[name];
    const label = name.toUpperCase();
    return (
      <div className="wy-pile-row">
        <span className="wy-pile-label">
          <span className="wy-pile-name">Pile {label}</span>
          <span className="wy-pile-count">{n}</span>
        </span>
        <span className={`wy-stones pile-${name}`}>
          {Array.from({ length: n }, (_, i) => {
            const take = i + 1;
            const to: Pos = name === 'a' ? { a: pos.a - take, b: pos.b } : { a: pos.a, b: pos.b - take };
            const classes = ['nim-stone', 'wy-stone'];
            if (i < takenFrom(name)) classes.push(shownClass);
            return (
              <button
                key={i}
                type="button"
                className={classes.join(' ')}
                data-row={navRow}
                data-col={i}
                aria-disabled={!game.humanToMove}
                aria-label={`Take ${take} from pile ${label}${notes(to)}`}
                onMouseEnter={() => setHover(to)}
                onMouseLeave={() => setHover(null)}
                onFocus={e => keyboardFocus(e.currentTarget) && setHover(to)}
                onBlur={() => setHover(null)}
                onClick={() => game.humanToMove && play(to)}
              />
            );
          })}
          {n === 0 && <span className="wy-empty">empty</span>}
        </span>
      </div>
    );
  }

  const shared = Math.min(pos.a, pos.b);
  const bothTaken = shown && pos.a - shown.a === pos.b - shown.b ? pos.a - shown.a : 0;

  const piles = (
    <div ref={pilesRef} className="play-board wy-piles" role="group" aria-label="Piles"
      aria-describedby="wythoff-board-text">
      {stoneRow('a', 0)}
      <div className="wy-pile-row wy-links-row">
        <span className="wy-pile-label wy-links-label">Both</span>
        <span className="wy-stones">
          {Array.from({ length: shared }, (_, i) => {
            const take = i + 1;
            const to: Pos = { a: pos.a - take, b: pos.b - take };
            const classes = ['wy-link'];
            if (i < bothTaken) classes.push(shownClass);
            return (
              <button
                key={i}
                type="button"
                className={classes.join(' ')}
                data-row={1}
                data-col={i}
                aria-disabled={!game.humanToMove}
                aria-label={`Take ${take} from both piles${notes(to)}`}
                onMouseEnter={() => setHover(to)}
                onMouseLeave={() => setHover(null)}
                onFocus={e => keyboardFocus(e.currentTarget) && setHover(to)}
                onBlur={() => setHover(null)}
                onClick={() => game.humanToMove && play(to)}
              />
            );
          })}
        </span>
      </div>
      {stoneRow('b', 2)}
      <p className="wy-equiv">
        Click a stone to take it and every stone to its left. Click between the rows to take that many from
        both piles. On the grid this is square {fmt(pos)}: column {pos.a}, row {pos.b}.
      </p>
    </div>
  );

  const playAgainRef = usePlayAgainFocus(game.phase);

  return (
    <div className="wythoff">
      <header className="game-header">
        <h1>Wythoff's Nim</h1>
        <Scoreboard stats={game.stats} />
      </header>

      <div className="play-controls">
        {game.phase === 'setup' && (
          <>
            {(['a', 'b'] as const).map(name => (
              <span key={name} className="size-stepper" aria-label={`Pile ${name.toUpperCase()}`}>
                <button type="button" className="btn-theme" aria-label={`Fewer in pile ${name.toUpperCase()}`}
                  disabled={prefs.start[name] <= 0} onClick={() => setPile(name, prefs.start[name] - 1)}>−</button>
                <span className="size-value">{name.toUpperCase()}: {prefs.start[name]}</span>
                <button type="button" className="btn-theme" aria-label={`More in pile ${name.toUpperCase()}`}
                  disabled={prefs.start[name] >= MAX_PILE} onClick={() => setPile(name, prefs.start[name] + 1)}>+</button>
              </span>
            ))}
            <button type="button" className="btn-theme" onClick={() => restart(randomStart())}>Random start</button>
            <CopyLinkButton values={{ a: prefs.start.a, b: prefs.start.b }} />
            <button type="button" className="btn-theme primary" disabled={isGameOver(pos)} onClick={() => {
              setComputerFrom(pos);
              game.computerFirst();
            }}>
              Computer moves first
            </button>
          </>
        )}
        {game.phase !== 'over' && (
          <button type="button" className="btn-theme" onClick={showHint} disabled={!game.humanToMove || isGameOver(pos)}>
            Hint
          </button>
        )}
        {game.phase !== 'setup' && (
          <button ref={playAgainRef} type="button" className={`btn-theme${game.phase === 'over' ? ' primary' : ''}`}
            onClick={() => restart(prefs.start)}>
            {game.phase === 'over' ? 'Play again' : 'Restart'}
          </button>
        )}
      </div>

      <div className="play-controls wy-options">
        <span className="wy-segmented" role="group" aria-label="View">
          {(['grid', 'piles', 'both'] as const).map(v => (
            <button key={v} type="button" aria-pressed={prefs.view === v}
              className={`btn-theme${prefs.view === v ? ' active' : ''}`}
              onClick={() => setPrefs({ ...prefs, view: v })}>
              {v === 'grid' ? 'Grid' : v === 'piles' ? 'Piles' : 'Both'}
            </button>
          ))}
        </span>
        {showGrid && (
          <span className="toggles">
            <label>
              <input type="checkbox" checked={prefs.marked}
                onChange={e => setPrefs({ ...prefs, marked: e.target.checked })} />
              Mark special squares
            </label>
          </span>
        )}
      </div>

      {game.phase === 'over' ? (
        <ResultBanner winner={game.winner} win="You reached (0, 0) and took the last stone."
          loss="It took the last stone. Play again and look for its pattern!" />
      ) : (
        <p className="turn-prompt" role="status">{prompt}</p>
      )}
      {game.phase === 'over' && (
        <NextSteps game="wythoff" winner={game.winner} helped={game.helpedWin}
          harder={{ label: 'Try a random start', onClick: () => restart(randomStart()) }} />
      )}
      {hint === 'none' && (
        <p className="hint-note">
          There is no winning move from here. Take a single stone and see whether the computer slips.
        </p>
      )}
      {hintPos && (
        <p className="hint-note">
          Hint: <strong>{describeMove(pos, hintPos)}</strong>, moving to {fmt(hintPos)} (glowing).
        </p>
      )}

      {marked && (
        <aside className="wy-questions" aria-label="Questions to think about">
          <h2>Think about it</h2>
          <ol>
            <li>What is the significance of the marked squares?</li>
            <li>What are the slopes of the lines that connect them?</li>
          </ol>
        </aside>
      )}

      <BoardDescription id="wythoff-board-text" text={boardText} spoken={spoken} onDescribe={describe} />
      <div className={`wy-layout view-${prefs.view}`}>
        {showGrid && grid}
        {showPiles && piles}
      </div>

      <section className="rules-card">
        <h2>How to play</h2>
        <ul className="rules">
          <li>There are two piles of stones. On your turn, take <strong>any number of stones from one pile</strong>, or <strong>the same number from both piles</strong>.</li>
          <li>Whoever takes the <strong>last stone wins</strong>.</li>
          <li>On the grid, the marker sits at (pile A, pile B). Taking from pile A moves it <strong>left</strong>, taking from pile B moves it <strong>down</strong>, and taking from both moves it <strong>diagonally down and left</strong>. Whoever reaches the corner (0, 0) wins. Switch between Grid and Piles to see that it is the same game.</li>
        </ul>
      </section>
    </div>
  );
}
