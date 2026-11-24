import { useMemo, useState } from 'react';
import { grundyValuesUpTo } from './logic';

/** Chart ranges the reader can pick; 1,500 is the default so the last zero (1,222) shows. */
const RANGES = [100, 1500, 10000] as const;
type Range = (typeof RANGES)[number];

const W = 640;
const H = 250;
const PAD = { left: 40, right: 22, top: 10, bottom: 26 };
/** Height of the strip under the plot that marks the zeros. */
const RUG = 30;
/** Bottom of the value plot; the zero strip sits below it. */
const PLOT_BOTTOM = H - PAD.bottom - RUG;
const RUG_Y = H - PAD.bottom - RUG / 2 + 2;

const LAST_ZERO = 1222;

const ext = { target: '_blank', rel: 'noopener' } as const;

/**
 * "Simple rules, unsolved problem": a scatter plot of Grundy values against
 * group size, with the zeros (first-player losses) picked out, plus the story
 * of what is and isn't known.
 */
export default function OpenProblem() {
  const [range, setRange] = useState<Range>(1500);
  const values = useMemo(() => grundyValuesUpTo(RANGES[RANGES.length - 1]), []);

  const { dots, zeros, maxValue, zeroCount } = useMemo(() => {
    let max = 1;
    for (let n = 1; n <= range; n++) max = Math.max(max, values[n]);
    const yMax = Math.ceil(max / 10) * 10 || 10;
    const x = (n: number) => PAD.left + ((n - 1) / (range - 1)) * (W - PAD.left - PAD.right);
    const y = (v: number) => PLOT_BOTTOM - (v / yMax) * (PLOT_BOTTOM - PAD.top);
    const s = range > 2000 ? 1.2 : range > 200 ? 1.6 : 3;
    let d = '';
    let z = '';
    let count = 0;
    for (let n = 1; n <= range; n++) {
      const px = x(n).toFixed(1);
      const py = y(values[n]).toFixed(1);
      if (values[n] === 0) {
        z += `M${px} ${RUG_Y - 7}v14`;
        count++;
      } else {
        d += `M${px} ${py}h${s}v${s}h-${s}z`;
      }
    }
    return { dots: d, zeros: z, maxValue: yMax, zeroCount: count };
  }, [range, values]);

  const xTicks = [1, Math.round(range / 4), Math.round(range / 2), Math.round((3 * range) / 4), range];
  const xAt = (n: number) => PAD.left + ((n - 1) / (range - 1)) * (W - PAD.left - PAD.right);
  const yAt = (v: number) => PLOT_BOTTOM - (v / maxValue) * (PLOT_BOTTOM - PAD.top);

  return (
    <section className="rules-card strategy-card open-problem">
      <h2>Simple rules, unsolved problem</h2>
      <p>
        Look at the values for groups of 4 to 12 dots: <strong>0, 2, 1, 0, 2, 1, 0, 2, 1</strong>. See a pattern?
        It's natural to guess that 0, 2, 1 repeats forever. What do you predict for 13 dots and up?
      </p>
      <PatternBreak values={values} />
      <p>
        The rules of Grundy's Game fit in one sentence, yet mathematicians
        still don't know the whole story. Computers have worked out the value of every group up to about{' '}
        <strong>285 billion dots</strong> without finding a pattern, and nobody has proved that the values
        eventually start repeating. (Many similar games do settle into a repeating cycle; for Grundy's Game it
        is an open question.)
      </p>
      <p>
        The chart plots each group size's value. The strip underneath marks the zeros: a single group with
        value 0 is a loss for whoever moves first. There are 42 of them, and the last one is at{' '}
        <strong>{LAST_ZERO.toLocaleString()} dots</strong>. After that, not one more zero has turned up in
        hundreds of billions of values. Is 1,222 really the last? Everyone believes so, but nobody can prove it.
      </p>

      <div className="chart-range" role="group" aria-label="Chart range">
        <span>Show sizes up to</span>
        {RANGES.map(r => (
          <button key={r} type="button" className={`btn-theme${r === range ? ' primary' : ''}`}
            aria-pressed={r === range} onClick={() => setRange(r)}>
            {r.toLocaleString()}
          </button>
        ))}
      </div>

      <figure className="open-problem-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label={`Grundy values for group sizes 1 to ${range.toLocaleString()}; ${zeroCount} of them are zero`}>
          {[0, maxValue / 2, maxValue].map(v => (
            <g key={v}>
              <line className="grid" x1={PAD.left} x2={W - PAD.right} y1={yAt(v)} y2={yAt(v)} />
              <text className="tick" x={PAD.left - 6} y={yAt(v) + 4} textAnchor="end">{v}</text>
            </g>
          ))}
          {xTicks.map(n => (
            <text key={n} className="tick" x={xAt(n)} y={H - 8} textAnchor="middle">{n.toLocaleString()}</text>
          ))}
          <path className="pts" d={dots} />
          <rect className="rug" x={PAD.left} y={RUG_Y - 10} width={W - PAD.left - PAD.right} height={20} rx={4} />
          <text className="tick" x={PAD.left - 6} y={RUG_Y + 4} textAnchor="end">0s</text>
          <path className="zeros" d={zeros} />
          {range >= LAST_ZERO && (
            <text className="callout" x={xAt(LAST_ZERO) + 6} y={RUG_Y + 4}>
              ← last zero: {LAST_ZERO.toLocaleString()}
            </text>
          )}
        </svg>
        <figcaption>
          Group size across, value up; each tick in the bottom strip is a size with value 0. Values grow slowly and unevenly: the largest found so far is 297.
        </figcaption>
      </figure>

      <p className="sources">
        Explore further: the values are{' '}
        <a href="https://oeis.org/A002188" {...ext}>OEIS A002188</a>, the zeros are{' '}
        <a href="https://oeis.org/A036685" {...ext}>OEIS A036685</a>, and Achim Flammenkamp's{' '}
        <a href="https://wwwhomes.uni-bielefeld.de/achim/grundy.html" {...ext}>record computations</a>{' '}
        go out to 285 billion.
      </p>
    </section>
  );
}

/** Sizes shown in the "see a pattern?" table: the 0, 2, 1 run (4–12) and where it breaks. */
const PATTERN_FROM = 4;
const PATTERN_TO = 18;
const CYCLE = [0, 2, 1];
/** Largest size whose real value shows before the reveal (matches the Strategy table). */
export const LAST_SHOWN = 12;

/**
 * Compares the guess "0, 2, 1 repeats" with the real values, so the reader sees
 * the pattern hold for 4–12 and fail at 13.
 */
function PatternBreak({ values }: { values: Uint16Array }) {
  const [revealed, setRevealed] = useState(false);
  const ns = Array.from({ length: PATTERN_TO - PATTERN_FROM + 1 }, (_, i) => PATTERN_FROM + i);
  const guess = (n: number) => CYCLE[(n - PATTERN_FROM) % 3];
  return (
    <div className="value-table-wrap">
      <table className="value-table pattern-break">
        <tbody>
          <tr>
            <th scope="row">Group size</th>
            {ns.map(n => <td key={n}>{n}</td>)}
          </tr>
          <tr>
            <th scope="row">Guess: 0, 2, 1 repeats</th>
            {ns.map(n => <td key={n} className="guess">{guess(n)}</td>)}
          </tr>
          <tr>
            <th scope="row">Actual value</th>
            {ns.map(n => {
              if (!revealed && n > LAST_SHOWN) return <td key={n} className="hidden-value">?</td>;
              const wrong = values[n] !== guess(n);
              return (
                <td key={n} className={wrong ? 'wrong' : 'right'}
                  aria-label={wrong ? `${values[n]}, not ${guess(n)}` : undefined}>
                  {values[n]}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      <p className={`pattern-reveal${revealed ? ' answer-box' : ''}`} aria-live="polite">
        {revealed ? (
          <>
            The guess fails at 13 dots, again at 16 and 18, and <strong>no pattern has turned up since</strong>.
          </>
        ) : (
          <button type="button" className="btn-theme primary" onClick={() => setRevealed(true)}>
            Click for answer
          </button>
        )}
      </p>
    </div>
  );
}
