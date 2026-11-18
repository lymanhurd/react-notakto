import { oddSizes, tally } from './balance';

export type Player = 'human' | 'computer';

export interface Stats {
  humanWins: number;
  computerWins: number;
}

export function Scoreboard({ stats }: { stats: Stats }) {
  return (
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
  );
}

export function ResultBanner({ winner, win, loss }: { winner: Player | null; win: string; loss: string }) {
  return (
    <div className={`result-banner ${winner === 'human' ? 'win' : 'loss'}`} role="status">
      <strong>{winner === 'human' ? 'You won!' : 'The computer won.'}</strong>
      <span>{winner === 'human' ? win : loss}</span>
    </div>
  );
}

/** Tally marks with matched pairs crossed off, as on the strategy worksheet. */
export function Marks({ count }: { count: number }) {
  const pairs = Math.floor(count / 2);
  return (
    <span className="tally-marks" aria-hidden="true">
      {Array.from({ length: pairs }, (_, i) => (
        <span key={i} className="tally-pair"><i className="mark" /><i className="mark" /></span>
      ))}
      {count % 2 === 1 && <span className="tally-odd"><i className="mark" /></span>}
      {count === 0 && <span className="tally-none">none</span>}
    </span>
  );
}

interface BalanceTallyProps {
  /** One value per row/group (Nim: row sizes; other games: group values). */
  values: number[];
  /** Cluster sizes to list, biggest first. */
  sizes: number[];
  title?: string;
  /** Optional line under the title explaining where the values come from. */
  note?: React.ReactNode;
}

/** The worksheet's tally table: clusters of each size across the board, and the verdict. */
export function BalanceTally({ values, sizes, title = 'Cluster tally', note }: BalanceTallyProps) {
  const counts = tally(values);
  const odd = oddSizes(values);
  const balanced = odd.length === 0;
  return (
    <section className="tally-card" aria-label={title}>
      <h2>{title}</h2>
      {note && <p className="tally-note">{note}</p>}
      <table className="tally-table">
        <thead>
          <tr>
            <th scope="col">Cluster</th>
            <th scope="col">Tally</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map(size => {
            const count = counts.get(size) ?? 0;
            const isOdd = count % 2 === 1;
            return (
              <tr key={size} className={isOdd ? 'odd' : 'even'}>
                <th scope="row">
                  <span className={`swatch c${size}`} aria-hidden="true" />
                  {size}'s
                </th>
                <td><Marks count={count} /></td>
                <td>
                  {count} <span className={`parity ${isOdd ? 'odd' : 'even'}`}>{isOdd ? 'Odd' : 'Even'}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={`verdict ${balanced ? 'balanced' : 'unbalanced'}`}>
        {balanced ? (
          <><strong>Balanced.</strong> Every cluster size is even.</>
        ) : (
          <><strong>Unbalanced.</strong> Odd: {odd.map(s => `${s}'s`).join(', ')}.</>
        )}
      </p>
    </section>
  );
}

/** Small colored chip showing a group's value split into power-of-two clusters. */
export function ValueChips({ value }: { value: number }) {
  if (value === 0) return <span className="value-chip zero">0</span>;
  const parts: number[] = [];
  for (let s = 8; s >= 1; s >>= 1) if (value & s) parts.push(s);
  return (
    <span className="value-chips" aria-label={`value ${value}`}>
      {parts.map(s => (
        <span key={s} className={`value-chip c${s}`}>{s}</span>
      ))}
    </span>
  );
}

/** Two-row table of sizes and their values; sizes on the board are highlighted. */
export function ValueTable({ label, from, max, value, present }: {
  label: string;
  from: number;
  max: number;
  value: (n: number) => number;
  present: Set<number>;
}) {
  const ns = Array.from({ length: max - from + 1 }, (_, i) => from + i);
  return (
    <div className="value-table-wrap">
      <table className="value-table">
        <tbody>
          <tr>
            <th scope="row">{label}</th>
            {ns.map(n => <td key={n} className={present.has(n) ? 'present' : ''}>{n}</td>)}
          </tr>
          <tr>
            <th scope="row">Value</th>
            {ns.map(n => <td key={n} className={present.has(n) ? 'present' : ''}>{value(n)}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
