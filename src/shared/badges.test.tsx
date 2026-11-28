import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import { allBadges, BADGES_KEY, syncBadges } from './badges'
import GrundyGame from '../grundy/GrundyGame'
import SiteFooter from './SiteFooter'
import Progress from '../progress/Progress'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const earned = () => allBadges().filter(b => b.earned).map(b => b.id)
const tick = (ms = 0) => act(() => { vi.advanceTimersByTime(ms) })

describe('badges from saved data', () => {
  it('awards Learner, Strategist and Master from a game score', () => {
    localStorage.setItem('nimStats', JSON.stringify({ humanWins: 4, computerWins: 1, cleanWins: 2 }))
    expect(earned()).toEqual(['nim-learner', 'nim-strategist'])
    localStorage.setItem('nimStats', JSON.stringify({ humanWins: 4, computerWins: 1, cleanWins: 3 }))
    expect(earned()).toEqual(['nim-learner', 'nim-strategist', 'nim-master'])
  })

  it('reads NoTakTo from its saved game, including second-player wins', () => {
    localStorage.setItem('notaktoSession', JSON.stringify({ stats: { humanWins: 1, computerWins: 0, secondWins: 1 } }))
    expect(earned()).toEqual(['notakto-learner', 'notakto-second'])
  })

  it('awards streak badges from the Daily Challenge record', () => {
    const solved = { tries: 1, solved: true, revealed: false }
    // Wednesday to Monday, skipping the weekend: a 4-day streak.
    const days = Object.fromEntries(['2026-11-25', '2026-11-26', '2026-11-27', '2026-11-30'].map(d => [d, solved]))
    localStorage.setItem('dailyChallenge', JSON.stringify({ days, streak: 1, best: 3, lastSolved: '2026-11-30' }))
    expect(earned()).toEqual(['daily-first', 'daily-3', 'daily-kinds'])
  })

  it('awards cross-game badges', () => {
    for (const key of ['nimStats', 'silverStats', 'kaylesStats', 'grundyStats']) {
      localStorage.setItem(key, JSON.stringify({ humanWins: 1, computerWins: 0, cleanWins: 1 }))
    }
    expect(earned()).toContain('cross-disguise')
    expect(earned()).not.toContain('cross-explorer')
  })

  it('dates each badge once', () => {
    localStorage.setItem('nimStats', JSON.stringify({ humanWins: 1, computerWins: 0 }))
    expect(syncBadges('2026-11-27').map(b => b.id)).toEqual(['nim-learner'])
    expect(syncBadges('2026-11-28')).toEqual([])
    expect(JSON.parse(localStorage.getItem(BADGES_KEY)!)).toEqual({ 'nim-learner': '2026-11-27' })
  })
})

/** Grundy's Game with the helpers off, starting from `size` dots. */
function grundy(size: number) {
  localStorage.setItem('grundyPrefs', JSON.stringify({ size, showValues: false, showTally: false }))
  render(<><GrundyGame /><SiteFooter /></>)
}

describe('new badges after a game', () => {
  it('announces the badges a win earns', () => {
    grundy(3)
    fireEvent.click(screen.getByRole('button', { name: /^Split 3 into 1 and 2/ }))
    tick()
    expect(screen.getByText(/New badges:/).textContent).toMatch(/Learner \(Grundy's Game\), Strategist \(Grundy's Game\)/)
  })

  it("doesn't announce badges earned before the page opened", () => {
    localStorage.setItem('grundyStats', JSON.stringify({ humanWins: 1, computerWins: 0, cleanWins: 1 }))
    grundy(3)
    tick()
    fireEvent.click(screen.getByRole('button', { name: /^Split 3 into 1 and 2/ }))
    tick()
    expect(screen.queryByText(/New badge/)).toBeNull()
  })

  it('counts a win after the computer moved first as a Second Mover win', () => {
    grundy(4)
    fireEvent.click(screen.getByRole('button', { name: 'Computer moves first' }))
    tick(1000)
    fireEvent.click(screen.getByRole('button', { name: /^Split 3 into 1 and 2/ }))
    tick()
    expect(JSON.parse(localStorage.getItem('grundyStats')!).secondWins).toBe(1)
    expect(screen.getByText(/New badges:/).textContent).toMatch(/Second Mover \(Grundy's Game\)/)
  })
})

describe('badge shelf', () => {
  it('lists earned and locked badges on the Progress page', () => {
    localStorage.setItem('nimStats', JSON.stringify({ humanWins: 1, computerWins: 0, cleanWins: 1 }))
    render(<Progress />)
    const total = allBadges().length
    expect(screen.getByText(`2 of ${total}`)).toBeDefined()
    expect(screen.getAllByText(/, earned\./)).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Badges' })).toBeDefined()
  })
})
