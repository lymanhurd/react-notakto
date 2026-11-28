import { describe, it, expect } from 'vitest'
import {
  addDays,
  applyDailyMove,
  currentStreak,
  dateKey,
  daysBetween,
  EMPTY_RECORD,
  isWeekend,
  isWin,
  puzzleFor,
  recount,
  recordReveal,
  recordTry,
  winningMoves,
} from './logic'

describe('dates', () => {
  it('counts days across months and years', () => {
    expect(daysBetween('2026-11-26', '2026-11-27')).toBe(1)
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28')
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('puzzles', () => {
  it('gives the same puzzle for the same date, and numbers days from #1', () => {
    expect(puzzleFor('2026-11-26')).toEqual(puzzleFor('2026-11-26'))
    expect(puzzleFor('2026-11-26').number).toBe(1)
    expect(puzzleFor('2026-12-26').number).toBe(31)
  })

  it('rotates Nim, Wythoff and Misère Nim', () => {
    expect(['2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29'].map(d => puzzleFor(d).kind))
      .toEqual(['nim', 'wythoff', 'misere', 'nim'])
  })

  it('always has a winning move, for a whole year of days', () => {
    for (let i = 0; i < 366; i++) {
      const p = puzzleFor(addDays('2026-11-26', i))
      const wins = winningMoves(p.kind, p.rows)
      expect(wins.length).toBeGreaterThan(0)
      for (const m of wins) expect(isWin(p.kind, applyDailyMove(p.rows, m))).toBe(true)
    }
  })

  it('checks wins by the rules of each game', () => {
    expect(isWin('nim', [1, 2, 3])).toBe(true)
    expect(isWin('nim', [0, 0, 0])).toBe(true)
    expect(isWin('misere', [0, 0])).toBe(false)
    expect(isWin('misere', [1, 1, 1])).toBe(true)
    expect(isWin('wythoff', [3, 5])).toBe(true)
    expect(winningMoves('wythoff', [4, 6])).toContainEqual({ row: 0, take: 1, both: true })
  })
})

describe('streaks', () => {
  it('builds on consecutive days and lapses after a missed weekday', () => {
    // November 24, 2026 is a Tuesday.
    let r = recordTry(EMPTY_RECORD, '2026-11-24', true)
    r = recordTry(r, '2026-11-25', false)
    r = recordTry(r, '2026-11-25', true)
    expect(r.streak).toBe(2)
    expect(r.days['2026-11-25']).toEqual({ tries: 2, solved: true, revealed: false })
    expect(currentStreak(r, '2026-11-26')).toBe(2)
    expect(currentStreak(r, '2026-11-27')).toBe(0)
    r = recordTry(r, '2026-11-27', true)
    expect(r.streak).toBe(1)
    expect(r.best).toBe(2)
  })

  it('never breaks a streak over a weekend, but a weekend solve extends it', () => {
    expect(isWeekend('2026-11-28')).toBe(true)
    expect(isWeekend('2026-11-30')).toBe(false)
    // Friday, then Monday: the weekend in between doesn't count.
    let r = recordTry(EMPTY_RECORD, '2026-11-27', true)
    expect(currentStreak(r, '2026-11-29')).toBe(1)
    expect(currentStreak(r, '2026-11-30')).toBe(1)
    expect(currentStreak(r, '2026-12-01')).toBe(0)
    r = recordTry(r, '2026-11-30', true)
    expect(r.streak).toBe(2)
    // Solving on Saturday adds to the streak.
    let s = recordTry(EMPTY_RECORD, '2026-11-27', true)
    s = recordTry(s, '2026-11-28', true)
    s = recordTry(s, '2026-11-30', true)
    expect(s.streak).toBe(3)
  })

  it('recounts streaks saved under the old rules, never lowering them', () => {
    const days = {
      '2026-11-27': { tries: 1, solved: true, revealed: false },
      '2026-11-30': { tries: 1, solved: true, revealed: false },
    }
    expect(recount({ days, streak: 1, best: 1, lastSolved: '2026-11-30' })).toMatchObject({ streak: 2, best: 2 })
    expect(recount({ days, streak: 5, best: 7, lastSolved: '2026-11-30' })).toMatchObject({ streak: 5, best: 7 })
  })

  it('ignores tries after solving, and revealing the answer forfeits the day', () => {
    let r = recordTry(EMPTY_RECORD, '2026-11-26', true)
    expect(recordTry(r, '2026-11-26', true)).toBe(r)
    r = recordReveal(r, '2026-11-27')
    r = recordTry(r, '2026-11-27', true)
    expect(r.days['2026-11-27'].solved).toBe(false)
    expect(currentStreak(r, '2026-11-28')).toBe(0)
  })
})
