import { useEffect, useState } from 'react';
import {
  applyMove,
  computerMove,
  destinations,
  isGameOver,
  MAX_COINS,
  MAX_SQUARES,
  MIN_COINS,
  pairs,
  piles,
  randomCoins,
  winningMoves,
} from './logic';
import type { Coins, Move } from './logic';
import { CLUSTER_SIZES, isBalanced } from '../shared/balance';
import { BalanceTally, ResultBanner, Scoreboard } from '../shared/GameParts';
import { load, save } from '../shared/storage';
import { useTurnGame } from '../shared/useTurnGame';
import { CoinFace } from './CoinFace';
import type { CoinKind } from './CoinFace';

const PREFS_KEY = 'silverPrefs';

interface Prefs {
  coins: number;
  squares: number;
  showGaps: boolean;
  showTally: boolean;
}

const describe = (m: Move) => `slide the coin on square ${m.from + 1} to square ${m.to + 1}`;

export default function SilverGame() {
  const [prefs, setPrefsState] = useState<Prefs>(() =>
    load(PREFS_KEY, { coins: 4, squares: 12, showGaps: false, showTally: true }));
  const setPrefs = (p: Prefs) => {
    setPrefsState(p);
    save(PREFS_KEY, p);
  };

  const [initial] = useState(() => randomCoins(prefs.coins, prefs.squares));
  const game = useTurnGame<Coins, Move>({
    initial,
    apply: applyMove,
    isOver: isGameOver,
    computerMove,
    statsKey: 'silverStats',
  });
  const coins = game.state;

  const [selected, setSelected] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [hint, setHint] = useState<Move | 'balanced' | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function newArrangement(next: Partial<Prefs> = {}) {
    const p = { ...prefs, ...next };
    p.squares = Math.max(p.squares, p.coins + 1);
    setPrefs(p);
    setSelected(null);
    setHint(null);
    game.reset(randomCoins(p.coins, p.squares));
  }

  function clickCoin(pos: number) {
    if (!game.humanToMove) return;
    // The hint stays visible while you pick up the coin, so its target square still glows.
    setSelected(sel => (sel === pos || destinations(coins, pos).length === 0 ? null : pos));
  }

  function moveTo(to: number) {
    if (selected === null) return;
    const move = { from: selected, to };
    setSelected(null);
    setHover(null);
    setHint(null);
    game.playHuman(move);
  }

  function showHint() {
    const wins = winningMoves(coins);
    setSelected(null);
    setHint(wins.length > 0 ? wins[0] : 'balanced');
  }

  const pileList = piles(coins);
  const balanced = isBalanced(pileList);
  const pairList = pairs(coins);
  const hintMove = hint && hint !== 'balanced' ? hint : null;
  const targets = new Set(selected !== null && game.humanToMove ? destinations(coins, selected) : []);
  const squares = Math.max(prefs.squares, (coins[coins.length - 1] ?? 0) + 1);

  // Which coins are trailing (silver) and which leading (copper).
  const role = new Map<number, 'trailing' | 'leading'>();
  for (const p of pairList) {
    role.set(p.trailing, 'trailing');
    if (p.leading !== null) role.set(p.leading, 'leading');
  }
  // Empty squares that belong to a counted gap.
  const counted = new Set<number>();
  for (const p of pairList) {
    for (let s = (p.leading ?? -1) + 1; s < p.trailing; s++) counted.add(s);
  }

  const biggest = Math.max(1, ...pileList, squares - 1);
  const sizes = CLUSTER_SIZES.filter(s => s <= biggest);

  let prompt: string;
  if (game.pending) {
    prompt = `The computer will ${describe(game.pending)}…`;
  } else if (selected !== null) {
    prompt = `Coin on square ${selected + 1} picked up. Click a highlighted square to slide it there (or click the coin again to put it back).`;
  } else if (game.phase === 'setup') {
    prompt = prefs.showGaps && balanced
      ? 'These gaps are Balanced, so the second player can always win. Let the computer go first!'
      : 'Click a coin to pick it up, then click a square closer to the star to slide it there. Or let the computer start.';
  } else if (game.lastComputerMove) {
    prompt = `The computer chose to ${describe(game.lastComputerMove)}. Your move.`;
  } else {
    prompt = 'Your move. Click a coin to pick it up.';
  }

  /** Normal play: every coin is a quarter. Nim view: leading coins are pennies, trailing coins dimes. */
  function coinKind(pos: number): CoinKind {
    if (!prefs.showGaps) return 'quarter';
    return role.get(pos) === 'leading' ? 'penny' : 'dime';
  }

  function coinClasses(pos: number): string {
    const classes = ['coin', coinKind(pos)];
    if (prefs.showGaps) classes.push(role.get(pos) ?? 'trailing');
    if (pos === selected) classes.push('selected');
    if (game.pending && game.pending.from === pos) classes.push('pending');
    if (hintMove && hintMove.from === pos) classes.push('hint');
    if (destinations(coins, pos).length === 0) classes.push('stuck');
    return classes.join(' ');
  }

  function cellClasses(s: number): string {
    const classes = ['cell'];
    if (prefs.showGaps && counted.has(s)) classes.push('counted');
    if (targets.has(s)) classes.push('target');
    if (targets.has(s) && hover === s) classes.push('hovered');
    if (game.pending && game.pending.to === s) classes.push('pending-target');
    if (hintMove && hintMove.to === s) classes.push('hint-target');
    return classes.join(' ');
  }

  return (
    <div className="silver">
      <header className="game-header">
        <h1>Silver Dollar Game</h1>
        <Scoreboard stats={game.stats} />
      </header>

      <div className="play-controls">
        {game.phase === 'setup' && (
          <>
            <span className="size-stepper" aria-label="Number of coins">
              <button type="button" className="btn-theme" aria-label="Fewer coins"
                disabled={prefs.coins <= MIN_COINS} onClick={() => newArrangement({ coins: prefs.coins - 1 })}>−</button>
              <span className="size-value">{prefs.coins} {prefs.coins === 1 ? 'coin' : 'coins'}</span>
              <button type="button" className="btn-theme" aria-label="More coins"
                disabled={prefs.coins >= MAX_COINS} onClick={() => newArrangement({ coins: prefs.coins + 1 })}>+</button>
            </span>
            <span className="size-stepper" aria-label="Number of squares">
              <button type="button" className="btn-theme" aria-label="Fewer squares"
                disabled={prefs.squares <= prefs.coins + 1} onClick={() => newArrangement({ squares: prefs.squares - 1 })}>−</button>
              <span className="size-value">{prefs.squares} squares</span>
              <button type="button" className="btn-theme" aria-label="More squares"
                disabled={prefs.squares >= MAX_SQUARES} onClick={() => newArrangement({ squares: prefs.squares + 1 })}>+</button>
            </span>
            <button type="button" className="btn-theme" onClick={() => newArrangement()}>Shuffle</button>
            <button type="button" className="btn-theme primary" onClick={() => { setSelected(null); game.computerFirst(); }}>
              Computer moves first
            </button>
          </>
        )}
        {game.phase !== 'over' && (
          <button type="button" className="btn-theme" onClick={showHint} disabled={!game.humanToMove}>
            Hint
          </button>
        )}
        {game.phase !== 'setup' && (
          <button type="button" className={`btn-theme${game.phase === 'over' ? ' primary' : ''}`}
            onClick={() => newArrangement()}>
            {game.phase === 'over' ? 'Play again' : 'New game'}
          </button>
        )}
        <span className="toggles">
          <label>
            <input type="checkbox" checked={prefs.showGaps}
              onChange={e => setPrefs({ ...prefs, showGaps: e.target.checked })} />
            Show gaps (Nim view)
          </label>
          {prefs.showGaps && (
            <label>
              <input type="checkbox" checked={prefs.showTally}
                onChange={e => setPrefs({ ...prefs, showTally: e.target.checked })} />
              Show tally
            </label>
          )}
        </span>
      </div>

      {game.phase === 'over' ? (
        <ResultBanner winner={game.winner} win="You made the last move."
          loss="It made the last move. Try the Nim view to see why!" />
      ) : (
        <p className="turn-prompt" role="status">{prompt}</p>
      )}
      {hint === 'balanced' && (
        <p className="hint-note">
          The gaps are <strong>Balanced</strong>, so there is no winning move right now. Slide a coin a single
          square and wait for a chance to rebalance.
        </p>
      )}
      {hintMove && (
        <p className="hint-note">
          Hint: <strong>{describe(hintMove)}</strong> (glowing) to leave Balanced gaps.
        </p>
      )}

      <div className={`play-layout${prefs.showGaps && prefs.showTally ? '' : ' no-tally'}`}>
        <div className="play-board silver-board">
          <div className="strip-scroll">
            <div
              className="strip"
              style={{ gridTemplateColumns: `auto repeat(${squares}, var(--cell))`, '--squares': squares } as React.CSSProperties}
            >
              <span className="star" style={{ gridRow: 1 }} title="The star end: coins slide this way" aria-label="Star end">★</span>
              {Array.from({ length: squares }, (_, s) => {
                const hasCoin = coins.includes(s);
                return (
                  <div key={s} className={cellClasses(s)}>
                    {hasCoin ? (
                      <button
                        type="button"
                        className={coinClasses(s)}
                        disabled={!game.humanToMove}
                        aria-pressed={s === selected}
                        aria-label={`Coin on square ${s + 1}${prefs.showGaps ? ` (${role.get(s) === 'leading' ? 'penny: copper, leading' : 'dime: silver, trailing'})` : ''}`}
                        onClick={() => clickCoin(s)}
                      >
                        <CoinFace kind={coinKind(s)} />
                      </button>
                    ) : targets.has(s) ? (
                      <button
                        type="button"
                        className="target-btn"
                        aria-label={`Slide to square ${s + 1}`}
                        onMouseEnter={() => setHover(s)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(s)}
                        onBlur={() => setHover(null)}
                        onClick={() => moveTo(s)}
                      />
                    ) : null}
                  </div>
                );
              })}
              {Array.from({ length: squares }, (_, s) => (
                <span key={`n${s}`} className="cell-number" style={{ gridColumn: s + 2, gridRow: 2 }}>{s + 1}</span>
              ))}
              {prefs.showGaps && pairList.map(p => {
                // A bracket under each pair (copper → silver, or star → silver) labeled with its pile.
                const start = (p.leading ?? -1) + 2; // grid column (column 1 is the star)
                const end = p.trailing + 3;
                return (
                  <span key={p.trailing} className={`pair-bracket${p.gap === 0 ? ' empty' : ''}`}
                    style={{ gridColumn: `${p.leading === null ? 1 : start} / ${end}`, gridRow: 3 }}>
                    <span className="pair-gap">{p.gap}</span>
                  </span>
                );
              })}
            </div>
          </div>
          {prefs.showGaps && (
            <p className="silver-legend">
              <span className="legend-coin dime" aria-hidden="true"><CoinFace kind="dime" /></span> dime = silver (trailing)
              <span className="legend-coin penny" aria-hidden="true"><CoinFace kind="penny" /></span> penny = copper (leading)
              <span className="legend-cell" aria-hidden="true" /> counted gap = Nim pile
            </p>
          )}
        </div>
        {prefs.showGaps && prefs.showTally && (
          <BalanceTally
            values={pileList}
            sizes={sizes}
            title="Gap tally"
            note="Each counted gap is a Nim pile. Balance them just like Nim rows."
          />
        )}
      </div>

      <section className="rules-card">
        <h2>How to play</h2>
        <ul className="rules">
          <li>Coins sit on a strip of squares. On your turn, slide <strong>one coin toward the star</strong> as far as you like.</li>
          <li>A coin can't jump over another coin or land on one.</li>
          <li>Whoever makes the <strong>last move wins</strong>: the loser is the player left with every coin packed against the star.</li>
        </ul>
      </section>

      <section className="rules-card strategy-card">
        <h2>Strategy: Nim in disguise</h2>
        <ol className="rules">
          <li>Starting from the far end, label the coins alternately <strong>silver</strong> (trailing) and <strong>copper</strong> (leading). In the Nim view the silver coins become dimes and the copper coins pennies.</li>
          <li>Each silver coin is paired with the copper coin just ahead of it. The number of empty squares between them is a <strong>Nim pile</strong>. With an odd number of coins, the last silver coin is paired with the star end of the strip.</li>
          <li>The gaps <em>in front of</em> copper coins don't count at all.</li>
          <li>If your opponent moves a <strong>copper</strong> coin, its gap behind grows: slide the matching silver coin the same number of squares to undo it.</li>
          <li>Otherwise, a silver move shrinks a pile exactly like a Nim move. Hand your opponent Balanced piles, as in Nim.</li>
        </ol>
        <p>
          Try it with 2 to 4 coins first: 3 or 4 coins is just two-pile Nim, which you can solve in your head.
          Then try 5 or more. Turn on <strong>Show gaps</strong> to see the piles.
        </p>
      </section>
    </div>
  );
}
