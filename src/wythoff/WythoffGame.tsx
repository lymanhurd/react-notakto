import { useMemo, useState } from 'react';
import {
  applyMove,
  computerMove,
  constructionSteps,
  describeMove,
  GRID,
  isGameOver,
  isLegal,
  isP,
  key,
  marksAfter,
  MAX_PILE,
  PHI,
  randomStart,
  safePair,
  samePos,
  winningMoves,
} from './logic';
import type { Mark, Pos } from './logic';
import { ResultBanner, Scoreboard } from '../shared/GameParts';
import { load, save } from '../shared/storage';
import { useTurnGame } from '../shared/useTurnGame';

const PREFS_KEY = 'wythoffPrefs';

type View = 'grid' | 'piles' | 'both';
type MarkMode = 'hidden' | 'shown' | 'build';

interface Prefs {
  start: Pos;
  view: View;
  marks: MarkMode;
  lines: boolean;
}

const SCRIPT_P = '𝒫';
const SCRIPT_N = '𝒩';
const fmt = (p: Pos) => `(${p.a}, ${p.b})`;

const STEPS = constructionSteps();
const ALL_MARKS = marksAfter(STEPS, STEPS.length);

export default function WythoffGame() {
  const [prefs, setPrefsState] = useState<Prefs>(() =>
    load(PREFS_KEY, { start: { a: 7, b: 11 }, view: 'both', marks: 'shown', lines: false }));
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
  });
  const pos = game.state;

  const [hover, setHover] = useState<Pos | null>(null);
  const [hint, setHint] = useState<Pos | 'safe' | null>(null);
  const [both, setBoth] = useState(false);
  const [built, setBuilt] = useState(0);
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
    const wins = winningMoves(pos);
    setHint(wins.length > 0 ? wins[0] : 'safe');
  }

  const marks: Map<string, Mark> = useMemo(
    () => (prefs.marks === 'build' ? marksAfter(STEPS, built) : prefs.marks === 'shown' ? ALL_MARKS : new Map()),
    [prefs.marks, built],
  );
  const latest = prefs.marks === 'build' && built > 0 ? STEPS[built - 1] : null;
  const latestN = useMemo(() => new Set(latest?.newN.map(key) ?? []), [latest]);

  const preview = game.humanToMove ? hover : null;
  const target = game.pending ?? preview;
  const hintPos = hint && hint !== 'safe' ? hint : null;
  const showGrid = prefs.view !== 'piles';
  const showPiles = prefs.view !== 'grid';

  let prompt: string;
  if (game.pending) {
    prompt = `The computer will ${describeMove(pos, game.pending)}, moving to ${fmt(game.pending)}…`;
  } else if (preview) {
    prompt = `Click to ${describeMove(pos, preview)}, moving to ${fmt(preview)}.`;
  } else if (game.phase === 'setup') {
    prompt = prefs.marks === 'shown' && isP(pos)
      ? `${fmt(pos)} is a ${SCRIPT_P} square, so the second player can always win. Let the computer go first!`
      : 'Make a move to start, or let the computer go first.';
  } else if (game.lastComputerMove) {
    prompt = `The computer chose to ${describeMove(computerFrom, game.lastComputerMove)}. Your move.`;
  } else {
    prompt = 'Your move.';
  }

  function cellClasses(p: Pos): string {
    const classes = ['wy-cell'];
    const m = marks.get(key(p));
    if (m === 'P') classes.push('p');
    if (m === 'N') classes.push('n');
    if (latest && samePos(latest.p, p)) classes.push('new-p');
    else if (latestN.has(key(p))) classes.push('new-n');
    if (samePos(pos, p)) classes.push('here');
    else if (game.humanToMove && isLegal(pos, p)) classes.push('reach');
    if (samePos(game.pending, p)) classes.push('pending');
    else if (samePos(preview, p)) classes.push('preview');
    if (samePos(hintPos, p)) classes.push('hint');
    return classes.join(' ');
  }

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
          <div className="wy-grid" role="grid" aria-label="Grid of positions">
            {rows.map(b => (
              <div key={b} className="wy-row" role="row">
                {cols.map(a => {
                  const p = { a, b };
                  const legal = game.humanToMove && isLegal(pos, p);
                  const m = marks.get(key(p));
                  const label = m ? (m === 'P' ? SCRIPT_P : SCRIPT_N) : '';
                  const here = samePos(pos, p);
                  return (
                    <span key={a} role="gridcell" className={cellClasses(p)}>
                      {legal ? (
                        <button
                          type="button"
                          aria-label={`Move to ${fmt(p)}`}
                          onMouseEnter={() => setHover(p)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={() => setHover(p)}
                          onBlur={() => setHover(null)}
                          onClick={() => play(p)}
                        >
                          {label}
                        </button>
                      ) : (
                        <span aria-label={here ? `Marker at ${fmt(p)}` : undefined}>
                          {here ? <i className="wy-marker" /> : label}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          {prefs.lines && (
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

  function pile(name: 'a' | 'b') {
    const n = pos[name];
    const other = name === 'a' ? pos.b : pos.a;
    const shown = target ?? hintPos;
    return (
      <div className="wy-pile">
        <div className="wy-pile-label">
          <span className="wy-pile-name">Pile {name.toUpperCase()}</span>
          <span className="wy-pile-count">{n} {n === 1 ? 'stone' : 'stones'}</span>
        </div>
        <div className="wy-stones">
          {Array.from({ length: n }, (_, i) => {
            const take = n - i;
            const to: Pos = both
              ? { a: pos.a - take, b: pos.b - take }
              : name === 'a' ? { a: i, b: pos.b } : { a: pos.a, b: i };
            const legal = game.humanToMove && (!both || take <= other);
            const classes = ['nim-stone', 'wy-stone'];
            if (shown && i >= shown[name]) {
              classes.push(game.pending ? 'pending' : target ? 'preview' : 'hint');
            }
            return (
              <button
                key={i}
                type="button"
                className={classes.join(' ')}
                disabled={!legal}
                aria-label={both
                  ? `Take ${take} from both piles`
                  : `Take ${take} from pile ${name.toUpperCase()}`}
                onMouseEnter={() => setHover(to)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(to)}
                onBlur={() => setHover(null)}
                onClick={() => play(to)}
              />
            );
          })}
          {n === 0 && <span className="wy-empty">empty</span>}
        </div>
      </div>
    );
  }

  const piles = (
    <div className="play-board wy-piles">
      {pile('a')}
      {pile('b')}
      <label className="wy-both">
        <input type="checkbox" checked={both} onChange={e => setBoth(e.target.checked)} />
        Take the same number from both piles
      </label>
      <p className="wy-equiv">
        Position {fmt(pos)}: column {pos.a}, row {pos.b} on the grid.
        {marks.has(key(pos)) && <> It is a{marks.get(key(pos)) === 'N' ? 'n' : ''} <strong>{marks.get(key(pos)) === 'P' ? SCRIPT_P : SCRIPT_N}</strong> position.</>}
      </p>
    </div>
  );

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
            <button type="button" className="btn-theme primary" onClick={() => {
              setComputerFrom(pos);
              game.computerFirst();
            }}
              disabled={isGameOver(pos)}>
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
          <button type="button" className={`btn-theme${game.phase === 'over' ? ' primary' : ''}`}
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
        <label className="wy-select">
          {SCRIPT_P}/{SCRIPT_N} squares
          <select value={prefs.marks} onChange={e => {
            setPrefs({ ...prefs, marks: e.target.value as MarkMode });
            setBuilt(0);
          }}>
            <option value="shown">Shown</option>
            <option value="build">Build step by step</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        {showGrid && (
          <span className="toggles">
            <label>
              <input type="checkbox" checked={prefs.lines}
                onChange={e => setPrefs({ ...prefs, lines: e.target.checked })} />
              Golden-ratio lines
            </label>
          </span>
        )}
      </div>

      {game.phase === 'over' ? (
        <ResultBanner winner={game.winner} win="You reached (0, 0) and took the last stone."
          loss={`It took the last stone. Try handing it a ${SCRIPT_P} square!`} />
      ) : (
        <p className="turn-prompt" role="status">{prompt}</p>
      )}
      {hint === 'safe' && (
        <p className="hint-note">
          You are on a <strong>{SCRIPT_P}</strong> square, so there is no winning move right now. Take a single
          stone and wait for the computer to slip.
        </p>
      )}
      {hintPos && (
        <p className="hint-note">
          Hint: <strong>{describeMove(pos, hintPos)}</strong> to reach {fmt(hintPos)}, a {SCRIPT_P} square
          (glowing).
        </p>
      )}

      {prefs.marks === 'build' && (
        <section className="rules-card wy-build" aria-label="Build the P and N squares">
          <div className="wy-build-controls">
            <button type="button" className="btn-theme primary" disabled={built >= STEPS.length}
              onClick={() => setBuilt(built + 1)}>Next step</button>
            <button type="button" className="btn-theme" disabled={built >= STEPS.length}
              onClick={() => setBuilt(STEPS.length)}>Finish</button>
            <button type="button" className="btn-theme" disabled={built === 0}
              onClick={() => setBuilt(0)}>Start over</button>
            <span className="wy-build-count">Step {built} of {STEPS.length}</span>
          </div>
          <p className="wy-build-text">{buildText(built)}</p>
        </section>
      )}

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

      <section className="rules-card strategy-card">
        <h2>Strategy</h2>
        <p>
          Every square is either a <strong>{SCRIPT_P}</strong> position ("<em>previous</em> player wins") or an{' '}
          <strong>{SCRIPT_N}</strong> position ("<em>next</em> player wins"). If you hand your opponent
          a {SCRIPT_P} square, you are the previous player, and you can win. The corner (0, 0) is {SCRIPT_P}:
          hand it over and your opponent has no move left.
        </p>
        <p>To find the rest, repeat two rules (choose <em>Build step by step</em> above to watch):</p>
        <ol className="rules">
          <li>Every square to the right of, above, or diagonally up and to the right of a {SCRIPT_P} square is {SCRIPT_N}, because from there you can move onto the {SCRIPT_P} square.</li>
          <li>A blank square that can't reach a {SCRIPT_P} square by moving left, down or diagonally down-left is {SCRIPT_P}. Mark it, and apply rule 1 again. Working outward from the corner, a square is {SCRIPT_P} whenever its neighbors to the left, below, and diagonally below-left are all {SCRIPT_N}.</li>
        </ol>
        <p>
          The {SCRIPT_P} squares are symmetric: if (x, y) is safe, so is (y, x). They run outward along two lines
          through the corner, with slopes φ ≈ 1.618 (the golden ratio) and 1/φ ≈ 0.618. Turn on the golden-ratio
          lines to see them. The pairs differ by 0, 1, 2, 3, …, and the smaller number of each pair is ⌊k·φ⌋:
        </p>
        <PairTable />
      </section>
    </div>
  );
}

function buildText(step: number): string {
  if (step === 0) {
    return `Press Next step. (0, 0) is ${SCRIPT_P}: whoever hands over the empty board wins.`;
  }
  const { p, newN } = STEPS[step - 1];
  const first = step === 1
    ? `(0, 0) is ${SCRIPT_P}.`
    : `${fmt(p)} is the first blank square (scanning each row from the left, starting at the bottom). It can't reach a ${SCRIPT_P} square, so it is ${SCRIPT_P}.`;
  const rest = newN.length > 0
    ? ` Every square to its right, above it, or diagonally up-right can move onto it, so ${newN.length} new squares become ${SCRIPT_N}.`
    : ' Every square it could reach from is already marked.';
  const done = step === STEPS.length ? ' The grid is complete.' : '';
  return first + rest + done;
}

function PairTable() {
  const ks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <div className="value-table-wrap">
      <table className="value-table">
        <tbody>
          <tr><th scope="row">k</th>{ks.map(k => <td key={k}>{k}</td>)}</tr>
          <tr><th scope="row">⌊k·φ⌋</th>{ks.map(k => <td key={k}>{safePair(k)[0]}</td>)}</tr>
          <tr><th scope="row">⌊k·φ⌋ + k</th>{ks.map(k => <td key={k}>{safePair(k)[1]}</td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}

