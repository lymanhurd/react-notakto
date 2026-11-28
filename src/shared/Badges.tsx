import { useEffect, useState } from 'react';
import { allBadges, badgeName, earnedDates, syncBadges } from './badges';
import type { Badge, BadgeGroup } from './badges';

/**
 * "New badge!" after a game or puzzle. It checks once the score has been saved
 * (the parent saves it in an effect, which runs after this component's), so it
 * waits a tick before looking.
 */
export function NewBadges() {
  const [fresh, setFresh] = useState<Badge[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => setFresh(syncBadges()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div role="status" className="new-badges-wrap">
      {fresh.length > 0 && (
        <p className="new-badges">
          <span className="badge-medal earned" aria-hidden="true">★</span>
          <span>
            {fresh.length === 1 ? 'New badge: ' : 'New badges: '}
            {fresh.map((b, i) => (
              <span key={b.id}>{i > 0 && ', '}<strong>{badgeName(b)}</strong></span>
            ))}
            . <a href="/progress/#badges">See your badges</a>
          </span>
        </p>
      )}
    </div>
  );
}

const GROUP_TITLES: Record<Exclude<BadgeGroup, 'game'>, string> = {
  daily: 'Daily Challenge',
  cross: 'Across games',
};

const shortDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

function BadgeItem({ badge, date }: { badge: Badge; date?: string }) {
  const earned = badge.earned || date !== undefined;
  return (
    <li className={`badge-item ${earned ? 'earned' : 'locked'}`}>
      <span className={`badge-medal ${earned ? 'earned' : ''}`} aria-hidden="true">{earned ? '★' : '☆'}</span>
      <span className="badge-text">
        <strong className="badge-title">{badge.title}</strong>
        <span className="visually-hidden">{earned ? ', earned. ' : ', not earned yet. '}</span>
        <span className="badge-how">{badge.how}</span>
        {earned && date && <span className="badge-date">Earned {shortDate(date)}</span>}
      </span>
    </li>
  );
}

/** Every badge, earned ones in color and the rest greyed out with how to earn them. */
export function BadgeShelf() {
  const [{ badges, dates }] = useState(() => {
    syncBadges();
    return { badges: allBadges(), dates: earnedDates() };
  });
  const isEarned = (b: Badge) => b.earned || dates[b.id] !== undefined;
  const earnedCount = badges.filter(isEarned).length;
  const gameTitles = [...new Set(badges.filter(b => b.group === 'game').map(b => b.game!))];

  const list = (items: Badge[]) => (
    <ul className="badge-list">
      {items.map(b => <BadgeItem key={b.id} badge={b} date={dates[b.id]} />)}
    </ul>
  );

  return (
    <section className="badges" id="badges" aria-labelledby="badges-heading">
      <h2 id="badges-heading">Badges</h2>
      <p className="badges-summary">
        You've earned <strong>{earnedCount} of {badges.length}</strong> badges.
      </p>

      <h3>{GROUP_TITLES.daily}</h3>
      {list(badges.filter(b => b.group === 'daily'))}

      <h3>Games</h3>
      <div className="badge-games">
        {gameTitles.map(title => {
          const items = badges.filter(b => b.game === title);
          return (
            <div className="badge-game" key={title}>
              <h4>{title} <span className="badge-game-count">{items.filter(isEarned).length}/{items.length}</span></h4>
              {list(items)}
            </div>
          );
        })}
      </div>

      <h3>{GROUP_TITLES.cross}</h3>
      {list(badges.filter(b => b.group === 'cross'))}
    </section>
  );
}
