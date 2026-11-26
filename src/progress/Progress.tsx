import { useState } from 'react';
import { games } from '../landing/games';
import { getName, readRecord } from '../shared/player';
import { currentStreak, DAILY_KEY, dateKey, EMPTY_RECORD } from '../daily/logic';
import { load } from '../shared/storage';

/**
 * The player's record in every game on this device: wins, wins without help and
 * losses. Each row links to its game, and games not tried yet are called out.
 */
export default function Progress() {
  const [name] = useState(getName);
  const [rows] = useState(() => games.map(g => ({ game: g, record: readRecord(g.statsKey) })));
  const [daily] = useState(() => {
    const record = load(DAILY_KEY, EMPTY_RECORD);
    return { streak: currentStreak(record, dateKey()), best: record.best };
  });

  const played = rows.filter(r => r.record.wins + r.record.losses > 0);
  const wins = rows.reduce((n, r) => n + r.record.wins, 0);
  const clean = rows.reduce((n, r) => n + r.record.cleanWins, 0);
  const untried = rows.filter(r => r.record.wins + r.record.losses === 0);

  return (
    <main className="progress">
      <h1>{name ? `${name}'s progress` : 'Your progress'}</h1>
      <p className="progress-summary">
        {played.length === 0
          ? 'You haven’t finished a game yet. Pick one below to get started!'
          : <>
              You've played <strong>{played.length} of {games.length}</strong> games and beaten the computer{' '}
              <strong>{wins === 1 ? 'once' : `${wins} times`}</strong>
              {wins > 0 && <>, <strong>{clean}</strong> of them without help</>}.
              {untried.length > 0 && <> Still to try: {untried.map(r => r.game.title).join(', ')}.</>}
            </>}
      </p>

      <p className="progress-daily">
        <a href="/daily/">Daily Challenge</a>:{' '}
        {daily.streak > 0
          ? <>current streak <strong>{daily.streak} {daily.streak === 1 ? 'day' : 'days'}</strong>, best {daily.best}.</>
          : daily.best > 0
            ? <>no streak right now (best {daily.best}). Solve today's puzzle to start a new one.</>
            : <>solve today's puzzle to start a streak.</>}
      </p>

      <div className="progress-table-wrap">
        <table className="progress-table">
          <thead>
            <tr>
              <th scope="col">Game</th>
              <th scope="col">Wins</th>
              <th scope="col">Wins without help</th>
              <th scope="col">Losses</th>
              <th scope="col"><span className="visually-hidden">Play</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ game, record }) => {
              const tried = record.wins + record.losses > 0;
              return (
                <tr key={game.href} className={tried ? '' : 'untried'}>
                  <th scope="row">
                    <a className="progress-game" href={game.href}
                      data-umami-event="progress-game-click" data-umami-event-game={game.href}
                      data-umami-event-tried={tried ? 'yes' : 'no'}>
                      {game.title}
                    </a>
                    <span className="progress-helpers">Help: {game.helpers.join(', ')}</span>
                  </th>
                  <td>{record.wins}</td>
                  <td className={record.cleanWins > 0 ? 'clean' : ''}>
                    {record.cleanWins}
                    {record.cleanWins > 0 && <span className="clean-star" aria-hidden="true"> ★</span>}
                  </td>
                  <td>{record.losses}</td>
                  <td className="progress-go">
                    {tried
                      ? <span className="progress-play">Play <span aria-hidden="true">→</span></span>
                      : <span className="progress-new">Not tried yet · Try it <span aria-hidden="true">→</span></span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="rules-card">
        <h2>What counts as a win without help?</h2>
        <p>
          A win where you never pressed <strong>Hint</strong> and every helper view was switched off from your
          first move to the end of the game: the clusters and tally in Nim, the marked squares in Wythoff's Nim,
          the values and tally in Kayles and Grundy's Game, the gaps in the Silver Dollar Game, and the position
          label in Chomp. The "Help" line under each game lists what to switch off.
        </p>
        <p>
          Your progress is saved in this browser only. On another computer or browser you'll start fresh, and you
          can clear it on the <a href="/privacy/">privacy page</a>.
        </p>
      </section>
    </main>
  );
}
