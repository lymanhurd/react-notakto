import { useEffect, useState } from 'react';
import {
  applyDailyMove,
  currentStreak,
  dateKey,
  dayResult,
  describeMove,
  EMPTY_RECORD,
  KIND_INFO,
  puzzleFor,
  recordReveal,
  recordTry,
  winningMoves,
  isWin,
  DAILY_KEY,
} from './logic';
import type { DailyMove, DailyRecord } from './logic';
import { load, save } from '../shared/storage';
import { track } from '../shared/analytics';
import { getName } from '../shared/player';
import { BoardDescription } from '../shared/GameParts';
import { useBoardNav } from '../shared/useBoardNav';
import { keyboardFocus } from '../shared/keyboardFocus';
import { useBoardDescription } from '../shared/useBoardDescription';


const longDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
};

/** Is stone `i` of `row` taken by `move` (stones are taken from the right-hand end)? */
function takes(move: DailyMove | null, rows: number[], row: number, i: number): boolean {
  if (!move) return false;
  if (!move.both && move.row !== row) return false;
  return i >= rows[row] - move.take;
}

export default function DailyChallenge() {
  const [today] = useState(() => dateKey());
  const [puzzle] = useState(() => puzzleFor(today));
  const [record, setRecord] = useState<DailyRecord>(() => load(DAILY_KEY, EMPTY_RECORD));
  const [name] = useState(getName);
  const [both, setBoth] = useState(false);
  const [hover, setHover] = useState<DailyMove | null>(null);
  // The last wrong try and the computer's winning answer to it, to explain the miss.
  const [miss, setMiss] = useState<{ move: DailyMove; reply: DailyMove | null } | null>(null);
  const [solvedWith, setSolvedWith] = useState<DailyMove | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => save(DAILY_KEY, record), [record]);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const info = KIND_INFO[puzzle.kind];
  const day = dayResult(record, today);
  const streak = currentStreak(record, today);
  const done = day.solved || day.revealed;
  const answers = winningMoves(puzzle.kind, puzzle.rows);
  const answer = day.revealed && !day.solved ? answers[0] : null;
  const shownRows = solvedWith ? applyDailyMove(puzzle.rows, solvedWith) : puzzle.rows;
  const wythoff = puzzle.kind === 'wythoff';

  function tryMove(move: DailyMove) {
    if (done) return;
    setHover(null);
    const after = applyDailyMove(puzzle.rows, move);
    const correct = isWin(puzzle.kind, after);
    setRecord(r => recordTry(r, today, correct));
    if (correct) {
      setSolvedWith(move);
      setMiss(null);
      track('daily-solved', { kind: puzzle.kind, tries: day.tries + 1 });
    } else {
      setMiss({ move, reply: winningMoves(puzzle.kind, after)[0] ?? null });
    }
  }

  function reveal() {
    setRecord(r => recordReveal(r, today));
    setMiss(null);
    track('daily-revealed', { kind: puzzle.kind, tries: day.tries });
  }

  const shareText = [
    `Lyman's Logic Games · Daily Challenge #${puzzle.number} (${info.title})`,
    day.solved
      ? `Solved in ${day.tries} ${day.tries === 1 ? 'try' : 'tries'} · ${streak}-day streak`
      : 'Not solved today',
    `${window.location.origin}/daily/`,
  ].join('\n');

  async function share() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
    } catch {
      // Copying can be blocked; nothing else to do.
    }
  }

  const rowName = (row: number) => (wythoff ? `Pile ${row === 0 ? 'A' : 'B'}` : `Row ${row + 1}`);
  const boardText = shownRows
    .map((n, row) => `${rowName(row)}: ${n === 0 ? 'empty' : `${n} ${n === 1 ? 'stone' : 'stones'}`}.`)
    .join(' ');
  const { describe: describeBoard, spoken } = useBoardDescription(boardText);
  const boardRef = useBoardNav(describeBoard);

  return (
    <main className="daily">
      <header className="daily-header">
        <div>
          <p className="eyebrow">Daily Challenge #{puzzle.number}</p>
          <h1>{info.title}</h1>
          <p className="daily-date">{longDate(today)}</p>
        </div>
        <div className="daily-streak" aria-label="Streak">
          <div className="score">
            <span className="score-label">Streak</span>
            <span className="score-value">{streak}</span>
          </div>
          <div className="score">
            <span className="score-label">Best</span>
            <span className="score-value">{record.best}</span>
          </div>
        </div>
      </header>

      <p className="daily-rules">
        {info.rules} <strong>Find a winning move:</strong> one that guarantees you can win, however well the
        computer plays.
      </p>

      {day.solved ? (
        <div className="result-banner win" role="status">
          <strong>Solved{name ? `, ${name}` : ''}!</strong>
          <span>
            {day.tries === 1 ? 'First try!' : `In ${day.tries} tries.`}{' '}
            {streak > 1 ? `That's a ${streak}-day streak.` : 'Your streak has started.'} Come back
            tomorrow for #{puzzle.number + 1}.
          </span>
        </div>
      ) : day.revealed ? (
        <div className="result-banner loss" role="status">
          <strong>Answer shown.</strong>
          <span>
            One winning move: {answer && describeMove(puzzle.kind, answer)} (glowing). Today won't count toward
            your streak; come back tomorrow for #{puzzle.number + 1}.
          </span>
        </div>
      ) : (
        <p className="turn-prompt" role="status">
          {hover
            ? `Click to ${describeMove(puzzle.kind, hover)}.`
            : day.tries === 0
              ? 'Click a stone to take it and every stone to its right.'
              : `Try ${day.tries + 1}. Click a stone to take it and every stone to its right.`}
        </p>
      )}

      {miss && !done && (
        <p className="hint-note daily-miss">
          Not quite. If you {describeMove(puzzle.kind, miss.move)}, the computer can win
          {miss.reply ? <> by answering: {describeMove(puzzle.kind, miss.reply)}</> : null}. Try another move.
        </p>
      )}

      <BoardDescription id="daily-board-text" text={boardText} spoken={spoken} onDescribe={describeBoard} />
      <div ref={boardRef} className={`daily-board play-board${done ? ' done' : ''}`}
        role="group" aria-label="Puzzle" aria-describedby="daily-board-text">
        {shownRows.map((n, row) => (
          <div className="daily-row" key={row} role="group" aria-label={rowName(row)}>
            <span className="daily-row-label">
              {wythoff ? `Pile ${row === 0 ? 'A' : 'B'}` : `Row ${row + 1}`}
              <span className="daily-row-count">{n}</span>
            </span>
            <span className={`daily-stones row-${row % 2}`}>
              {Array.from({ length: n }, (_, i) => {
                const take = n - i;
                const move: DailyMove = both ? { row: 0, take, both: true } : { row, take, both: false };
                const legal = !done && (!both || take <= Math.min(...puzzle.rows));
                const classes = ['nim-stone'];
                if (!done && takes(hover, puzzle.rows, row, i)) classes.push('preview');
                if (takes(answer, puzzle.rows, row, i)) classes.push('hint');
                return (
                  <button
                    key={i}
                    type="button"
                    className={classes.join(' ')}
                    disabled={!legal}
                    data-row={legal ? row : undefined}
                    data-col={legal ? i : undefined}
                    aria-label={`${both ? `Take ${take} from both piles` : `${rowName(row)}: take ${take}`}${
                      takes(answer, puzzle.rows, row, i) && take === answer?.take ? ' (a winning move)' : ''}`}
                    onMouseEnter={() => setHover(move)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={e => keyboardFocus(e.currentTarget) && setHover(move)}
                    onBlur={() => setHover(null)}
                    onClick={() => tryMove(move)}
                  />
                );
              })}
              {n === 0 && <span className="daily-empty">empty</span>}
            </span>
          </div>
        ))}
        {wythoff && !done && (
          <label className="daily-both">
            <input type="checkbox" checked={both} onChange={e => setBoth(e.target.checked)} />
            Take the same number from both piles
          </label>
        )}
      </div>

      <div className="play-controls daily-actions">
        {done ? (
          <button type="button" className="btn-theme primary" onClick={share} data-umami-event="daily-share">
            {copied ? 'Copied!' : 'Copy my result'}
          </button>
        ) : (
          <button type="button" className="btn-theme" onClick={reveal}>
            Show a winning move
          </button>
        )}
        <a className="daily-practice" href={info.href}>Practice {info.title} against the computer →</a>
      </div>
      {!done && (
        <p className="daily-note">Showing the answer means today won't count toward your streak.</p>
      )}

      <section className="rules-card">
        <h2>How the Daily Challenge works</h2>
        <ul className="rules">
          <li>There's one new puzzle every day, the same for everyone. They rotate through Nim, Wythoff's Nim and Misère Nim.</li>
          <li>Take as many tries as you need. Solve it on consecutive days to build your <strong>streak</strong>; miss a day and it starts over.</li>
          <li>Your streak is saved in this browser only, like your scores.</li>
        </ul>
      </section>
    </main>
  );
}
