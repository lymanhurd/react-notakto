import { useEffect, useState } from 'react';
import {
  applyMove,
  clusters,
  computerMove,
  CLUSTER_SIZES,
  isBalanced,
  isGameOver,
  MAX_ROW,
  MAX_ROWS,
  parseRows,
  PRESETS,
  randomRows,
  winningMoves,
} from './logic';
import type { Move, Rows } from './logic';
import { BalanceTally } from '../shared/GameParts';
import { trackGameEnd, trackGameStart } from '../shared/analytics';

type Player = 'human' | 'computer';
type Phase = 'setup' | 'playing' | 'over';

const COMPUTER_DELAY_MS = 900;
const STATS_KEY = 'nimStats';
const PREFS_KEY = 'nimPrefs';

interface Stats {
  humanWins: number;
  computerWins: number;
}

interface Prefs {
  showClusters: boolean;
  showTally: boolean;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); the game still works.
  }
}

const fmt = (rows: Rows) => `(${rows.join(', ')})`;
const stonesWord = (n: number) => (n === 1 ? 'stone' : 'stones');

/** Is stone `idx` of `row` part of `move` (moves take stones from the right-hand end)? */
function inMove(move: Move | null, rows: Rows, row: number, idx: number): boolean {
  return move !== null && move.row === row && idx >= rows[row] - move.take;
}

// ---- Board ------------------------------------------------------

interface BoardProps {
  rows: Rows;
  showClusters: boolean;
  interactive: boolean;
  selection: Move | null;
  hover: Move | null;
  pending: Move | null;
  hint: Move | null;
  onHover: (move: Move | null) => void;
  onPick: (move: Move) => void;
}

function NimBoard({
  rows, showClusters, interactive, selection, hover, pending, hint, onHover, onPick,
}: BoardProps) {
  return (
    <div className={`nim-board${showClusters ? ' show-clusters' : ''}`}>
      {rows.map((n, row) => {
        // Lay stones out left to right in greedy clusters (biggest first).
        let idx = 0;
        const groups = clusters(n).map(size => {
          const start = idx;
          idx += size;
          return { size, start };
        });
        return (
          <div className="nim-row" key={row}>
            <div className="nim-row-label">
              <span className="nim-row-name">Row {row + 1}</span>
              <span className="nim-row-count">
                {n === 0
                  ? 'empty'
                  : showClusters && groups.length > 1
                    ? `${n} = ${groups.map(g => g.size).join(' + ')}`
                    : n}
              </span>
            </div>
            <div className="nim-stones">
              {groups.map(({ size, start }) => (
                <span key={start} className={`nim-cluster c${size}`} title={`${size}-cluster`}>
                  {Array.from({ length: size }, (_, k) => {
                    const i = start + k;
                    const take = n - i;
                    const classes = ['nim-stone'];
                    if (inMove(pending, rows, row, i)) classes.push('pending');
                    else if (inMove(selection, rows, row, i)) classes.push('selected');
                    else if (inMove(hover, rows, row, i)) classes.push('preview');
                    if (inMove(hint, rows, row, i)) classes.push('hint');
                    return (
                      <button
                        key={i}
                        type="button"
                        className={classes.join(' ')}
                        disabled={!interactive}
                        aria-label={`Row ${row + 1}: take ${take} ${stonesWord(take)}`}
                        onMouseEnter={() => onHover({ row, take })}
                        onMouseLeave={() => onHover(null)}
                        onFocus={() => onHover({ row, take })}
                        onBlur={() => onHover(null)}
                        onClick={() => onPick({ row, take })}
                      />
                    );
                  })}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Game -------------------------------------------------------

export default function NimGame() {
  const [startRows, setStartRows] = useState<Rows>(PRESETS[0].rows);
  const [rows, setRows] = useState<Rows>(PRESETS[0].rows);
  const [phase, setPhase] = useState<Phase>('setup');
  const [turn, setTurn] = useState<Player>('human');
  const [winner, setWinner] = useState<Player | null>(null);
  const [selection, setSelection] = useState<Move | null>(null);
  const [hover, setHover] = useState<Move | null>(null);
  const [pending, setPending] = useState<Move | null>(null);
  const [hint, setHint] = useState<Move | 'balanced' | null>(null);
  const [lastComputerMove, setLastComputerMove] = useState<Move | null>(null);
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState(false);
  const [stats, setStats] = useState<Stats>(() => load(STATS_KEY, { humanWins: 0, computerWins: 0 }));
  const [prefs, setPrefs] = useState<Prefs>(() => load(PREFS_KEY, { showClusters: true, showTally: true }));

  useEffect(() => save(STATS_KEY, stats), [stats]);
  useEffect(() => save(PREFS_KEY, prefs), [prefs]);

  /** Apply a move for `who`, then hand the turn over or end the game. */
  function play(who: Player, move: Move) {
    if (who === 'human' && phase === 'setup') trackGameStart('nim', 'human', fmt(rows));
    const next = applyMove(rows, move);
    setRows(next);
    setSelection(null);
    setHover(null);
    setHint(null);
    if (isGameOver(next)) {
      // Normal play: whoever takes the last stone wins.
      setPhase('over');
      setWinner(who);
      trackGameEnd('nim', who);
      setStats(s => (who === 'human'
        ? { ...s, humanWins: s.humanWins + 1 }
        : { ...s, computerWins: s.computerWins + 1 }));
    } else {
      setPhase('playing');
      if (who === 'human') {
        setTurn('computer');
        setPending(computerMove(next));
      } else {
        setTurn('human');
      }
    }
  }

  // The computer's move is chosen when its turn starts and shown as `pending`;
  // after a short pause it is played. Changing the board clears `pending`,
  // which cancels the timer.
  useEffect(() => {
    if (!pending) return;
    const move = pending;
    const timer = window.setTimeout(() => {
      setPending(null);
      setLastComputerMove(move);
      play('computer', move);
    }, COMPUTER_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per computer move
  }, [pending]);

  const humanToMove = phase !== 'over' && turn === 'human' && pending === null;

  function pick(move: Move) {
    if (!humanToMove) return;
    // Clicking the already-selected stone confirms the move.
    if (selection && selection.row === move.row && selection.take === move.take) {
      play('human', move);
    } else {
      setSelection(move);
      setHint(null);
    }
  }

  function chooseBoard(next: Rows) {
    setStartRows(next);
    setRows(next);
    setPhase('setup');
    setTurn('human');
    setWinner(null);
    setSelection(null);
    setHint(null);
    setPending(null);
    setLastComputerMove(null);
  }

  function computerFirst() {
    trackGameStart('nim', 'computer', fmt(rows));
    setPhase('playing');
    setTurn('computer');
    setPending(computerMove(rows));
  }

  function showHint() {
    const moves = winningMoves(rows);
    setHint(moves.length > 0 ? moves[0] : 'balanced');
    setSelection(null);
  }

  function submitCustom(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseRows(custom);
    setCustomError(parsed === null);
    if (parsed) chooseBoard(parsed);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelection(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Tally rows: every cluster size that could appear on this board.
  const biggest = Math.max(...startRows);
  const sizes = CLUSTER_SIZES.filter(s => s <= biggest);

  let prompt: string;
  if (pending) {
    prompt = `The computer is taking ${pending.take} ${stonesWord(pending.take)} from row ${pending.row + 1}…`;
  } else if (selection) {
    prompt = `Take ${selection.take} ${stonesWord(selection.take)} from row ${selection.row + 1}? Click the stone again or press Take.`;
  } else if (phase === 'setup') {
    prompt = isBalanced(rows)
      ? 'This board is Balanced, so the player who moves second can always win. Let the computer go first!'
      : 'Click a stone to move first: you take it and every stone to its right. Or let the computer start.';
  } else if (lastComputerMove) {
    prompt = `The computer took ${lastComputerMove.take} ${stonesWord(lastComputerMove.take)} from row ${lastComputerMove.row + 1}. Your move.`;
  } else {
    prompt = 'Your move. Click a stone to take it and every stone to its right.';
  }

  return (
    <div className="nim">
      <header className="game-header">
        <h1>Nim</h1>
        <div className="scoreboard" aria-live="polite">
          <div className="score">
            <span className="score-label">Human</span>
            <span className="score-value">{stats.humanWins}</span>
          </div>
          <div className="score">
            <span className="score-label">Computer</span>
            <span className="score-value">{stats.computerWins}</span>
          </div>
        </div>
      </header>

      <section className="play-setup" aria-label="Choose a starting board">
        <div className="preset-list">
          {PRESETS.map(p => {
            const active = fmt(p.rows) === fmt(startRows);
            return (
              <button
                key={p.label}
                type="button"
                className={`preset${active ? ' active' : ''}`}
                aria-pressed={active}
                onClick={() => chooseBoard(p.rows)}
              >
                <span className="preset-rows">{fmt(p.rows)}</span>
                <span className="preset-label">{p.label}</span>
              </button>
            );
          })}
          <button type="button" className="preset" onClick={() => chooseBoard(randomRows())}>
            <span className="preset-rows">( ?, ?, ? )</span>
            <span className="preset-label">Random</span>
          </button>
        </div>
        <form className="custom-board" onSubmit={submitCustom}>
          <label htmlFor="nim-custom">Your own board</label>
          <input
            id="nim-custom"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 1, 3, 5, 7"
            value={custom}
            onChange={e => {
              setCustom(e.target.value);
              setCustomError(false);
            }}
            aria-invalid={customError}
            aria-describedby="nim-custom-help"
          />
          <button type="submit" className="btn-theme">Set up</button>
          <span id="nim-custom-help" className={`custom-help${customError ? ' error' : ''}`}>
            Up to {MAX_ROWS} rows of 1–{MAX_ROW} stones.
          </span>
        </form>
      </section>

      <div className="play-controls">
        {phase === 'setup' && (
          <button type="button" className="btn-theme primary" onClick={computerFirst}>
            Computer moves first
          </button>
        )}
        {selection && humanToMove && (
          <>
            <button type="button" className="btn-theme primary" onClick={() => play('human', selection)}>
              Take {selection.take}
            </button>
            <button type="button" className="btn-theme" onClick={() => setSelection(null)}>
              Cancel
            </button>
          </>
        )}
        {phase !== 'over' && !selection && (
          <button type="button" className="btn-theme" onClick={showHint} disabled={!humanToMove}>
            Hint
          </button>
        )}
        {phase !== 'setup' && (
          <button
            type="button"
            className={`btn-theme${phase === 'over' ? ' primary' : ''}`}
            onClick={() => chooseBoard(startRows)}
          >
            {phase === 'over' ? 'Play again' : 'Restart'}
          </button>
        )}
        <span className="toggles">
          <label>
            <input
              type="checkbox"
              checked={prefs.showClusters}
              onChange={e => setPrefs(p => ({ ...p, showClusters: e.target.checked }))}
            />
            Show clusters
          </label>
          <label>
            <input
              type="checkbox"
              checked={prefs.showTally}
              onChange={e => setPrefs(p => ({ ...p, showTally: e.target.checked }))}
            />
            Show tally
          </label>
        </span>
      </div>

      {phase === 'over' ? (
        <div className={`result-banner ${winner === 'human' ? 'win' : 'loss'}`} role="status">
          <strong>{winner === 'human' ? 'You won!' : 'The computer won.'}</strong>
          <span>
            {winner === 'human'
              ? 'You took the last stone.'
              : 'It took the last stone. Try handing it a Balanced board!'}
          </span>
        </div>
      ) : (
        <p className="turn-prompt" role="status">{prompt}</p>
      )}

      {hint === 'balanced' && (
        <p className="hint-note">
          The board is <strong>Balanced</strong>, so there is no winning move right now. Take a single
          stone and wait for a chance to rebalance.
        </p>
      )}
      {hint && hint !== 'balanced' && (
        <p className="hint-note">
          Hint: take <strong>{hint.take} {stonesWord(hint.take)} from row {hint.row + 1}</strong> to leave a
          Balanced board{prefs.showClusters ? ' (the glowing stones)' : ''}.
        </p>
      )}

      <div className={`play-layout${prefs.showTally ? '' : ' no-tally'}`}>
        <NimBoard
          rows={rows}
          showClusters={prefs.showClusters}
          interactive={humanToMove}
          selection={selection}
          hover={humanToMove ? hover : null}
          pending={pending}
          hint={hint && hint !== 'balanced' ? hint : null}
          onHover={setHover}
          onPick={pick}
        />
        {prefs.showTally && <BalanceTally values={rows} sizes={sizes} />}
      </div>

      <section className="rules-card">
        <h2>How to play</h2>
        <ul className="rules">
          <li>On your turn, choose <strong>one row</strong> and take as many stones as you like from it (at least one).</li>
          <li>Whoever takes the <strong>very last stone wins</strong>.</li>
          <li>
            Each row is grouped into power-of-two <strong>clusters</strong> (8, 4, 2, 1), biggest first.
            A board is <strong>Balanced</strong> when every cluster size appears an even number of times.
          </li>
          <li>
            The winning strategy: always hand your opponent a Balanced board. Find the largest odd cluster
            size, then take stones from a row containing it so every tally becomes even.
          </li>
        </ul>
      </section>
    </div>
  );
}
