import { useState } from 'react';
import {
  applyKnock,
  computerKnock,
  isGameOver,
  kaylesValue,
  MAX_PINS,
  MIN_PINS,
  newPins,
  runs,
  runValues,
  winningKnocks,
} from './logic';
import type { Knock, Pins } from './logic';
import { CLUSTER_SIZES } from '../shared/balance';
import { BalanceTally, CopyLinkButton, NextSteps, ResultBanner, Scoreboard, ValueChips, ValueTable, BoardDescription } from '../shared/GameParts';
import { useBoardNav } from '../shared/useBoardNav';
import { keyboardFocus } from '../shared/keyboardFocus';
import { useBoardDescription } from '../shared/useBoardDescription';
import { usePlayAgainFocus } from '../shared/usePlayAgainFocus';
import { intParam } from '../shared/position';
import { load, save } from '../shared/storage';
import { useTurnGame } from '../shared/useTurnGame';

const PREFS_KEY = 'kaylesPrefs';

/** A link like ?pins=12 sets the starting row. */
const linked = (p: Prefs): Prefs => ({ ...p, size: intParam('pins', MIN_PINS, MAX_PINS) ?? p.size });

interface Prefs {
  size: number;
  showValues: boolean;
  showTally: boolean;
}

const same = (a: Knock | null, b: Knock | null) =>
  a !== null && b !== null && a.index === b.index && a.count === b.count;

const covers = (k: Knock | null, i: number) => k !== null && i >= k.index && i < k.index + k.count;

const describe = (k: Knock) =>
  k.count === 1 ? `knock down pin ${k.index + 1}` : `knock down pins ${k.index + 1} and ${k.index + 2}`;

type Segment = { kind: 'run'; start: number; length: number } | { kind: 'down'; index: number };

function segments(pins: Pins): Segment[] {
  const out: Segment[] = [];
  let i = 0;
  while (i < pins.length) {
    if (!pins[i]) {
      out.push({ kind: 'down', index: i });
      i++;
    } else {
      const start = i;
      while (i < pins.length && pins[i]) i++;
      out.push({ kind: 'run', start, length: i - start });
    }
  }
  return out;
}

export default function KaylesGame() {
  const [prefs, setPrefsState] = useState<Prefs>(() =>
    linked(load(PREFS_KEY, { size: 10, showValues: true, showTally: true })));
  const setPrefs = (p: Prefs) => {
    setPrefsState(p);
    save(PREFS_KEY, p);
  };

  const game = useTurnGame<Pins, Knock>({
    initial: newPins(prefs.size),
    apply: applyKnock,
    isOver: isGameOver,
    computerMove: computerKnock,
    statsKey: 'kaylesStats',
    game: 'kayles',
    describeStart: p => `${p.length} pins`,
    helpersOn: prefs.showValues || prefs.showTally,
  });
  const pins = game.state;

  const [hover, setHover] = useState<Knock | null>(null);
  const [hint, setHint] = useState<Knock | 'balanced' | null>(null);

  function play(knock: Knock) {
    setHover(null);
    setHint(null);
    game.playHuman(knock);
  }

  function resize(size: number) {
    setPrefs({ ...prefs, size });
    setHover(null);
    setHint(null);
    game.reset(newPins(size));
  }

  function showHint() {
    game.markHint();
    const wins = winningKnocks(pins);
    setHint(wins.length > 0 ? wins[0] : 'balanced');
  }

  const values = runValues(pins);
  const biggestValue = Math.max(0, ...Array.from({ length: prefs.size + 1 }, (_, n) => kaylesValue(n)));
  const sizes = CLUSTER_SIZES.filter(s => s <= Math.max(1, biggestValue));
  const hintKnock = hint && hint !== 'balanced' ? hint : null;
  const preview = game.humanToMove ? hover : null;

  let prompt: string;
  if (game.pending) {
    prompt = `The computer will ${describe(game.pending)}…`;
  } else if (preview) {
    prompt = `Click to ${describe(preview)}.`;
  } else if (game.phase === 'setup') {
    prompt = 'Click a pin to knock it down, or the link between two pins to knock down both. Or let the computer start.';
  } else if (game.lastComputerMove) {
    prompt = `The computer chose to ${describe(game.lastComputerMove)}. Your move.`;
  } else {
    prompt = 'Your move. Knock down one pin, or two side by side.';
  }

  function pinClasses(i: number): string {
    const classes = ['dot', 'pin'];
    if (covers(game.pending, i)) classes.push('pending');
    else if (covers(preview, i)) classes.push('preview');
    if (covers(hintKnock, i)) classes.push('hint');
    return classes.join(' ');
  }

  const playAgainRef = usePlayAgainFocus(game.phase);

  const standing = segments(pins).filter(seg => seg.kind !== 'down') as { start: number; length: number }[];
  const runText = standing.map(({ start, length }) => length === 1
    ? `pin ${start + 1}`
    : `pins ${start + 1} to ${start + length}`).join('; ');
  const boardText = standing.length === 0
    ? 'All pins are down.'
    : `${standing.length === 1 ? 'One run' : `${standing.length} runs`} of standing pins: ${runText}.${
      prefs.showValues ? ` Run values: ${standing.map(r => kaylesValue(r.length)).join(', ')}.` : ''}`;
  const { describe: describeBoard, spoken } = useBoardDescription(boardText);
  const boardRef = useBoardNav(describeBoard);

  return (
    <div className="kayles">
      <header className="game-header">
        <h1>Kayles</h1>
        <Scoreboard stats={game.stats} />
      </header>

      <div className="play-controls">
        {game.phase === 'setup' && (
          <>
            <span className="size-stepper" aria-label="Number of pins">
              <button type="button" className="btn-theme" aria-label="Fewer pins"
                disabled={prefs.size <= MIN_PINS} onClick={() => resize(prefs.size - 1)}>−</button>
              <span className="size-value">{prefs.size} {prefs.size === 1 ? 'pin' : 'pins'}</span>
              <button type="button" className="btn-theme" aria-label="More pins"
                disabled={prefs.size >= MAX_PINS} onClick={() => resize(prefs.size + 1)}>+</button>
            </span>
            <button type="button" className="btn-theme primary" onClick={game.computerFirst}>
              Computer moves first
            </button>
            <CopyLinkButton values={{ pins: prefs.size }} />
          </>
        )}
        {game.phase !== 'over' && (
          <button type="button" className="btn-theme" onClick={showHint} disabled={!game.humanToMove}>
            Hint
          </button>
        )}
        {game.phase !== 'setup' && (
          <button ref={playAgainRef} type="button" className={`btn-theme${game.phase === 'over' ? ' primary' : ''}`}
            onClick={() => resize(prefs.size)}>
            {game.phase === 'over' ? 'Play again' : 'Restart'}
          </button>
        )}
        <span className="toggles">
          <label>
            <input type="checkbox" checked={prefs.showValues}
              onChange={e => setPrefs({ ...prefs, showValues: e.target.checked })} />
            Show values
          </label>
          <label>
            <input type="checkbox" checked={prefs.showTally}
              onChange={e => setPrefs({ ...prefs, showTally: e.target.checked })} />
            Show tally
          </label>
        </span>
      </div>

      {game.phase === 'over' ? (
        <ResultBanner winner={game.winner} win="You knocked down the last pin."
          loss="It knocked down the last pin. Try handing it a Balanced board!" />
      ) : (
        <p className="turn-prompt" role="status">{prompt}</p>
      )}
      {game.phase === 'over' && (
        <NextSteps game="kayles" winner={game.winner} helped={game.helpedWin} strategyHref="#strategy"
          harder={prefs.size < MAX_PINS ? { label: `Try ${prefs.size + 1} pins`, onClick: () => resize(prefs.size + 1) } : undefined} />
      )}
      {hint === 'balanced' && (
        <p className="hint-note">
          The board is <strong>Balanced</strong>, so there is no winning move right now. Make any move and
          wait for a chance to rebalance.
        </p>
      )}
      {hintKnock && (
        <p className="hint-note">
          Hint: <strong>{describe(hintKnock)}</strong> (glowing) to leave a Balanced board.
        </p>
      )}

      <BoardDescription id="kayles-board-text" text={boardText} spoken={spoken} onDescribe={describeBoard} />
      <div className={`play-layout${prefs.showTally ? '' : ' no-tally'}`}>
        <div ref={boardRef} className="play-board kayles-board" role="group" aria-label="Pins"
          aria-describedby="kayles-board-text">
          {segments(pins).map(seg => {
            if (seg.kind === 'down') {
              return (
                <span key={`d${seg.index}`} className="kayles-down" aria-hidden="true">
                  <span className="dot down" />
                </span>
              );
            }
            const { start, length } = seg;
            return (
              <div key={`r${start}`} className="kayles-run">
                <div className="kayles-pins">
                  {Array.from({ length }, (_, k) => {
                    const i = start + k;
                    const single: Knock = { index: i, count: 1 };
                    const pair: Knock = { index: i, count: 2 };
                    const linkClasses = ['link'];
                    if (same(game.pending, pair)) linkClasses.push('pending');
                    else if (same(preview, pair)) linkClasses.push('preview');
                    if (same(hintKnock, pair)) linkClasses.push('hint');
                    return (
                      <span key={i} className="kayles-slot">
                        <button
                          type="button"
                          className={pinClasses(i)}
                          data-row={0}
                          data-col={2 * i}
                          aria-disabled={!game.humanToMove}
                          aria-label={`Knock down pin ${i + 1}${same(hintKnock, single) ? ', hint' : ''}`}
                          onMouseEnter={() => setHover(single)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={e => keyboardFocus(e.currentTarget) && setHover(single)}
                          onBlur={() => setHover(null)}
                          onClick={() => game.humanToMove && play(single)}
                        />
                        {k < length - 1 && (
                          <button
                            type="button"
                            className={linkClasses.join(' ')}
                            data-row={0}
                            data-col={2 * i + 1}
                            aria-disabled={!game.humanToMove}
                            aria-label={`Knock down pins ${i + 1} and ${i + 2}${same(hintKnock, pair) ? ', hint' : ''}`}
                            onMouseEnter={() => setHover(pair)}
                            onMouseLeave={() => setHover(null)}
                            onFocus={e => keyboardFocus(e.currentTarget) && setHover(pair)}
                            onBlur={() => setHover(null)}
                            onClick={() => game.humanToMove && play(pair)}
                          />
                        )}
                      </span>
                    );
                  })}
                </div>
                <div className="group-label">
                  <span>{length}</span>
                  {prefs.showValues && <ValueChips value={kaylesValue(length)} />}
                </div>
              </div>
            );
          })}
          {pins.every(p => !p) && <p className="kayles-empty">All pins are down.</p>}
        </div>
        {prefs.showTally && (
          <BalanceTally
            values={values}
            sizes={sizes}
            title="Value tally"
            note="Each run of standing pins counts as a Nim row whose size is its value from the table below."
          />
        )}
      </div>

      <section className="rules-card">
        <h2>How to play</h2>
        <ul className="rules">
          <li>Start with one row of pins. On your turn, knock down <strong>one pin</strong>, or <strong>two pins standing side by side</strong> (click the small link between them).</li>
          <li>Knocking down pins splits the row into separate runs; pins in different runs aren't neighbors.</li>
          <li>Whoever knocks down the <strong>last pin wins</strong>.</li>
        </ul>
      </section>

      <section id="strategy" className="rules-card strategy-card">
        <h2>Strategy</h2>
        <p>
          Each run of standing pins behaves exactly like a Nim row whose size is its <strong>value</strong> from
          the table below. So use the Nim strategy: split each value into power-of-two clusters (8, 4, 2, 1), and
          hand your opponent a board where every cluster size appears an even number of times.
        </p>
        <p>
          On a single row the first player always wins: knock down the middle pin (or middle two) and then copy
          your opponent's moves on the other side. Every run of 1 or more pins has a value above 0.
        </p>
        <p>
          Unlike Grundy's Game, Kayles values are known to repeat: from 72 pins onward the values cycle every 12
          (4, 1, 2, 8, 1, 4, 7, 2, 1, 8, 2, 7 for sizes 72, 73, …). Below that, only a few sizes break the pattern.
        </p>
        <ValueTable label="Run length" from={1} max={Math.max(15, prefs.size)} value={kaylesValue}
          present={new Set(runs(pins))} />
      </section>
    </div>
  );
}
