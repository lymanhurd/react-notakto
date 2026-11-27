import { useState } from 'react';
import {
  applySplit,
  canSplit,
  computerSplit,
  grundyValue,
  groupValues,
  isGameOver,
  MAX_DOTS,
  MIN_DOTS,
  winningSplits,
} from './logic';
import type { Groups, Split } from './logic';
import { CLUSTER_SIZES, isBalanced } from '../shared/balance';
import { BalanceTally, CopyLinkButton, NextSteps, ResultBanner, Scoreboard, ValueChips, ValueTable, BoardDescription } from '../shared/GameParts';
import { useBoardNav } from '../shared/useBoardNav';
import { useBoardDescription } from '../shared/useBoardDescription';
import { usePlayAgainFocus } from '../shared/usePlayAgainFocus';
import { intParam } from '../shared/position';
import { load, save } from '../shared/storage';
import { useTurnGame } from '../shared/useTurnGame';
import OpenProblem, { LAST_SHOWN } from './OpenProblem';

const PREFS_KEY = 'grundyPrefs';

/** A link like ?dots=12 sets the starting row. */
const linked = (p: Prefs): Prefs => ({ ...p, size: intParam('dots', MIN_DOTS, MAX_DOTS) ?? p.size });

interface Prefs {
  size: number;
  showValues: boolean;
  showTally: boolean;
}

const same = (a: Split | null, b: Split | null) =>
  a !== null && b !== null && a.group === b.group && a.left === b.left;

const describe = (groups: Groups, s: Split) =>
  `split ${groups[s.group]} into ${s.left} and ${groups[s.group] - s.left}`;

export default function GrundyGame() {
  const [prefs, setPrefsState] = useState<Prefs>(() =>
    linked(load(PREFS_KEY, { size: 8, showValues: true, showTally: true })));
  const setPrefs = (p: Prefs) => {
    setPrefsState(p);
    save(PREFS_KEY, p);
  };

  const game = useTurnGame<Groups, Split>({
    initial: [prefs.size],
    apply: applySplit,
    isOver: isGameOver,
    computerMove: computerSplit,
    statsKey: 'grundyStats',
    game: 'grundy',
    describeStart: g => `${g.reduce((a, b) => a + b, 0)} dots`,
    helpersOn: prefs.showValues || prefs.showTally,
  });
  const groups = game.state;

  const [hover, setHover] = useState<Split | null>(null);
  const [hint, setHint] = useState<Split | 'balanced' | null>(null);

  function play(split: Split) {
    setHover(null);
    setHint(null);
    game.playHuman(split);
  }

  function resize(size: number) {
    setPrefs({ ...prefs, size });
    setHint(null);
    game.reset([size]);
  }

  function showHint() {
    game.markHint();
    const wins = winningSplits(groups);
    setHint(wins.length > 0 ? wins[0] : 'balanced');
  }

  const values = groupValues(groups);
  const balanced = isBalanced(values);
  const biggestValue = Math.max(0, ...Array.from({ length: prefs.size + 1 }, (_, n) => grundyValue(n)));
  const sizes = CLUSTER_SIZES.filter(s => s <= Math.max(1, biggestValue));
  const hintSplit = hint && hint !== 'balanced' ? hint : null;

  let prompt: string;
  if (game.pending) {
    prompt = `The computer will ${describe(groups, game.pending)}…`;
  } else if (hover && game.humanToMove) {
    prompt = `Click to ${describe(groups, hover)}.`;
  } else if (game.phase === 'setup') {
    prompt = prefs.showValues && balanced
      ? 'This row is Balanced (value 0), so the second player can always win. Let the computer go first!'
      : 'Click a gap between two dots to split the row into two unequal groups, or let the computer start.';
  } else if (game.lastComputerMove) {
    prompt = `The computer chose to ${describe(applyUndo(groups, game.lastComputerMove), game.lastComputerMove)}. Your move.`;
  } else {
    prompt = 'Your move. Click a gap to split a group into two unequal groups.';
  }

  // Index of each group's first dot along the row (used as a stable key).
  const starts = groups.map((_, g) => groups.slice(0, g).reduce((a, b) => a + b, 0));

  const playAgainRef = usePlayAgainFocus(game.phase);

  const dotsList = groups.length === 1 ? `${groups[0]}` : `${groups.slice(0, -1).join(', ')} and ${groups[groups.length - 1]}`;
  const boardText = `${groups.length === 1 ? 'One group' : `${groups.length} groups`} of dots: ${dotsList}.${
    prefs.showValues ? ` Values: ${groups.map(grundyValue).join(', ')}.` : ''}`;
  const { describe: describeBoard, spoken } = useBoardDescription(boardText);
  const boardRef = useBoardNav(describeBoard);

  return (
    <div className="grundy">
      <header className="game-header">
        <h1>Grundy's Game</h1>
        <Scoreboard stats={game.stats} />
      </header>

      <div className="play-controls">
        {game.phase === 'setup' && (
          <>
            <span className="size-stepper" aria-label="Number of dots">
              <button type="button" className="btn-theme" aria-label="Fewer dots"
                disabled={prefs.size <= MIN_DOTS} onClick={() => resize(prefs.size - 1)}>−</button>
              <span className="size-value">{prefs.size} dots</span>
              <button type="button" className="btn-theme" aria-label="More dots"
                disabled={prefs.size >= MAX_DOTS} onClick={() => resize(prefs.size + 1)}>+</button>
            </span>
            <button type="button" className="btn-theme primary" onClick={game.computerFirst}>
              Computer moves first
            </button>
            <CopyLinkButton values={{ dots: prefs.size }} />
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
        <ResultBanner winner={game.winner} win="You made the last split."
          loss="It made the last split. Try handing it a Balanced board!" />
      ) : (
        <p className="turn-prompt" role="status">{prompt}</p>
      )}
      {game.phase === 'over' && (
        <NextSteps game="grundy" winner={game.winner} helped={game.helpedWin} strategyHref="#strategy"
          harder={prefs.size < MAX_DOTS ? { label: `Try ${prefs.size + 1} dots`, onClick: () => resize(prefs.size + 1) } : undefined} />
      )}
      {hint === 'balanced' && (
        <p className="hint-note">
          The board is <strong>Balanced</strong>, so there is no winning split right now. Make any split and
          wait for a chance to rebalance.
        </p>
      )}
      {hintSplit && (
        <p className="hint-note">
          Hint: <strong>{describe(groups, hintSplit)}</strong> (the glowing gap) to leave a Balanced board.
        </p>
      )}

      <BoardDescription id="grundy-board-text" text={boardText} spoken={spoken} onDescribe={describeBoard} />
      <div className={`play-layout${prefs.showTally ? '' : ' no-tally'}`}>
        <div ref={boardRef} className={`play-board grundy-board${game.humanToMove ? '' : ' waiting'}`}
          role="group" aria-label="Dots" aria-describedby="grundy-board-text">
          {groups.map((n, g) => {
            const first = starts[g];
            const dead = n < MIN_DOTS;
            return (
              <div key={`${g}-${first}`} className={`grundy-group${dead ? ' dead' : ''}`}
                role="group" aria-label={`Group ${g + 1}: ${n} ${n === 1 ? 'dot' : 'dots'}`}>
                <div className="grundy-dots">
                  {Array.from({ length: n }, (_, k) => (
                    <span key={k} className="grundy-slot">
                      {k > 0 && (() => {
                        const split = { group: g, left: k };
                        const legal = canSplit(n, k);
                        const classes = ['gap-btn'];
                        if (same(game.pending, split)) classes.push('pending');
                        else if (same(hover, split) && game.humanToMove) classes.push('preview');
                        if (same(hintSplit, split)) classes.push('hint');
                        if (!legal) classes.push('equal');
                        return (
                          <button
                            type="button"
                            className={classes.join(' ')}
                            disabled={!legal}
                            aria-disabled={legal ? !game.humanToMove : undefined}
                            data-row={legal ? g : undefined}
                            data-col={legal ? k : undefined}
                            aria-label={legal
                              ? `Split ${n} into ${k} and ${n - k}${same(hintSplit, split) ? ', hint' : ''}`
                              : `Can't split ${n} into equal halves`}
                            onMouseEnter={() => legal && setHover(split)}
                            onMouseLeave={() => setHover(null)}
                            onFocus={() => legal && setHover(split)}
                            onBlur={() => setHover(null)}
                            onClick={() => game.humanToMove && play(split)}
                          />
                        );
                      })()}
                      <span className="dot" aria-hidden="true" />
                    </span>
                  ))}
                </div>
                <div className="group-label">
                  <span>{n}</span>
                  {prefs.showValues && <ValueChips value={grundyValue(n)} />}
                </div>
              </div>
            );
          })}
        </div>
        {prefs.showTally && (
          <BalanceTally
            values={values}
            sizes={sizes}
            title="Value tally"
            note="Each group counts as a Nim row whose size is its value from the table below."
          />
        )}
      </div>

      <section className="rules-card">
        <h2>How to play</h2>
        <ul className="rules">
          <li>Start with one row of dots. On your turn, pick a group and split it into <strong>two groups of different sizes</strong> by clicking the gap where you want to cut.</li>
          <li>Groups of 1 or 2 can't be split (a group of 2 would make two equal halves).</li>
          <li>Whoever makes the <strong>last split wins</strong>.</li>
        </ul>
      </section>

      <section id="strategy" className="rules-card strategy-card">
        <h2>Strategy</h2>
        <p>
          Each group behaves exactly like a Nim row whose size is its <strong>value</strong> from the table
          below. (Mathematicians also call this value the group's <em>nimber</em> or <em>Grundy value</em>.) So use the Nim strategy: split each value into power-of-two clusters (8, 4, 2, 1), and hand
          your opponent a board where every cluster size appears an even number of times.
        </p>
        <p>
          A group's value is the smallest number that is <em>not</em> the value of any position you can reach
          from it in one split (the "mex" rule).
        </p>
        <ValueTable label="Group size" max={LAST_SHOWN} value={grundyValue}
          present={new Set(groups)} from={1} />
      </section>

      <OpenProblem />
    </div>
  );
}

/** Undo a split (merge the two pieces) to describe the computer's last move. */
function applyUndo(groups: Groups, s: Split): Groups {
  const merged = groups[s.group] + (groups[s.group + 1] ?? 0);
  return [...groups.slice(0, s.group), merged, ...groups.slice(s.group + 2)];
}
