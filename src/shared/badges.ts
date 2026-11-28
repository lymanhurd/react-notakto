// Badges, worked out from what the site already saves in this browser: each game's
// score and the Daily Challenge record. Nothing is sent anywhere.
//
// The only thing badges add to localStorage is the date each one was first seen
// (under "badges"), so a game can say "New badge!" the moment one is earned.

import { games } from '../landing/games';
import { readRecord } from './player';
import { load, save } from './storage';
import { dateKey, loadDaily, puzzleFor } from '../daily/logic';
import type { Kind } from '../daily/logic';

export const BADGES_KEY = 'badges';

/** Wins without help needed for a game's Master badge. */
export const MASTER_WINS = 3;

export type BadgeGroup = 'daily' | 'game' | 'cross';

export interface Badge {
  id: string;
  title: string;
  /** How to earn it, as a short sentence. */
  how: string;
  group: BadgeGroup;
  /** The game's title, for game badges. */
  game?: string;
  earned: boolean;
}

/** "nim" from "/nim/". */
const slug = (href: string) => href.replace(/\//g, '');

/**
 * Games where the computer can move first and still lose, so the player can win as the
 * second player. (Chomp and Kayles starts are always first-player wins.)
 */
const SECOND_MOVER_GAMES = new Set(['nim', 'misere-nim', 'silver', 'wythoff', 'grundy', 'notakto']);

/** Wins in games where the computer moved first. */
export function readSecondWins(statsKey: string): number {
  try {
    const saved = JSON.parse(localStorage.getItem(statsKey) ?? '{}');
    const n = (statsKey === 'notaktoSession' ? saved?.stats : saved)?.secondWins;
    return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

const NIM_IN_DISGUISE = ['nim', 'silver', 'kayles', 'grundy'];
const LAST_MOVE_LOSES = ['misere-nim', 'notakto'];

/** Every badge, and whether the saved data shows it as earned. */
export function allBadges(): Badge[] {
  const records = games.map(g => ({ id: slug(g.href), game: g, record: readRecord(g.statsKey) }));
  const byId = new Map(records.map(r => [r.id, r.record]));
  const clean = (id: string) => (byId.get(id)?.cleanWins ?? 0) > 0;

  const daily = loadDaily();
  const solved = Object.keys(daily.days).filter(d => daily.days[d].solved);
  const firstTry = solved.filter(d => daily.days[d].tries === 1).length;
  const kinds = new Set<Kind>(solved.map(d => puzzleFor(d).kind));

  const badges: Badge[] = [
    { id: 'daily-first', title: 'First Puzzle', how: 'Solve a Daily Challenge.', earned: solved.length > 0 },
    { id: 'daily-3', title: 'Hat Trick', how: 'Reach a 3-day Daily Challenge streak.', earned: daily.best >= 3 },
    { id: 'daily-5', title: 'Full Week', how: 'Reach a 5-day streak: one school week.', earned: daily.best >= 5 },
    { id: 'daily-20', title: 'Puzzle Pro', how: 'Reach a 20-day streak: about a school month.', earned: daily.best >= 20 },
    { id: 'daily-sharp', title: 'Sharp Eye', how: 'Solve 5 Daily Challenges on the first try.', earned: firstTry >= 5 },
    {
      id: 'daily-kinds', title: 'All Three Kinds',
      how: "Solve a Nim, a Wythoff's Nim and a Misère Nim Daily Challenge.", earned: kinds.size >= 3,
    },
  ].map(b => ({ ...b, group: 'daily' as const }));

  for (const { id, game, record } of records) {
    const g = { group: 'game' as const, game: game.title };
    badges.push(
      { ...g, id: `${id}-learner`, title: 'Learner', how: `Beat the computer at ${game.title}.`, earned: record.wins > 0 },
      {
        ...g, id: `${id}-strategist`, title: 'Strategist',
        how: `Beat the computer at ${game.title} without help.`, earned: record.cleanWins > 0,
      },
      {
        ...g, id: `${id}-master`, title: 'Master',
        how: `Beat the computer at ${game.title} ${MASTER_WINS} times without help.`,
        earned: record.cleanWins >= MASTER_WINS,
      },
    );
    if (SECOND_MOVER_GAMES.has(id)) {
      badges.push({
        ...g, id: `${id}-second`, title: 'Second Mover',
        how: id === 'notakto'
          ? 'Win with an even number of boards, where the computer moves first.'
          : `Win a game of ${game.title} where the computer moved first.`,
        earned: readSecondWins(game.statsKey) > 0,
      });
    }
  }

  const cross = { group: 'cross' as const };
  badges.push(
    {
      ...cross, id: 'cross-disguise', title: 'Nim in Disguise',
      how: 'Be a Strategist in Nim, the Silver Dollar Game, Kayles and Grundy’s Game: one strategy wins them all.',
      earned: NIM_IN_DISGUISE.every(clean),
    },
    {
      ...cross, id: 'cross-upside-down', title: 'Upside Down',
      how: 'Be a Strategist in Misère Nim and NoTakTo, where the last move loses.',
      earned: LAST_MOVE_LOSES.every(clean),
    },
    {
      ...cross, id: 'cross-explorer', title: 'Explorer', how: 'Beat the computer at least once in every game.',
      earned: records.every(r => r.record.wins > 0),
    },
    {
      ...cross, id: 'cross-grand-master', title: 'Grand Master', how: 'Be a Master in every game.',
      earned: records.every(r => r.record.cleanWins >= MASTER_WINS),
    },
  );
  return badges;
}

/** Dates badges were first seen, by id. */
export function earnedDates(): Record<string, string> {
  return load<Record<string, string>>(BADGES_KEY, {});
}

/**
 * Note the date of any badge earned since the last check and return those badges.
 * Badges are never taken away: once dated, a badge stays earned.
 */
export function syncBadges(today: string = dateKey()): Badge[] {
  const dates = earnedDates();
  const fresh = allBadges().filter(b => b.earned && !dates[b.id]);
  if (fresh.length > 0) save(BADGES_KEY, { ...dates, ...Object.fromEntries(fresh.map(b => [b.id, today])) });
  return fresh;
}

/** A badge's name with its game, e.g. "Strategist (Nim)". */
export const badgeName = (b: Badge) => (b.game ? `${b.title} (${b.game})` : b.title);
