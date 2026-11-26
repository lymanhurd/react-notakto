import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import DailyChallenge from './DailyChallenge'
import DailyTeaser from '../landing/DailyTeaser'
import { applyDailyMove, isWin, legalMoves, puzzleFor, winningMoves } from './logic'
import type { DailyMove } from './logic'

const TODAY = '2026-11-27' // Daily Challenge #2: Wythoff's Nim

/** The accessible name of the stone that makes `m` (stones are taken from the right). */
function label(kind: string, m: DailyMove): string {
  if (m.both) return `Take ${m.take} from both piles`
  const name = kind === 'wythoff' ? `Pile ${m.row === 0 ? 'A' : 'B'}` : `Row ${m.row + 1}`
  return `${name}: take ${m.take}`
}

function click(kind: string, m: DailyMove) {
  if (m.both) fireEvent.click(screen.getByLabelText('Take the same number from both piles'))
  fireEvent.click(screen.getAllByRole('button', { name: label(kind, m) })[0])
  if (m.both) {
    const box = screen.queryByLabelText('Take the same number from both piles') as HTMLInputElement | null
    if (box?.checked) fireEvent.click(box)
  }
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 27, 9, 0))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Daily Challenge page', () => {
  it("shows today's numbered puzzle", () => {
    render(<DailyChallenge />)
    const p = puzzleFor(TODAY)
    expect(screen.getByText('Daily Challenge #2')).toBeDefined()
    expect(screen.getByRole('heading', { name: "Wythoff's Nim" })).toBeDefined()
    expect(screen.getByText(`${p.rows[0]}`)).toBeDefined()
  })

  it('explains a wrong move, then records the solve and starts a streak', () => {
    const p = puzzleFor(TODAY)
    const wrong = legalMoves(p.kind, p.rows).find(m => !isWin(p.kind, applyDailyMove(p.rows, m)))!
    render(<DailyChallenge />)
    click(p.kind, wrong)
    expect(screen.getByText(/Not quite/)).toBeDefined()
    click(p.kind, winningMoves(p.kind, p.rows)[0])
    expect(screen.getByText('Solved!')).toBeDefined()
    expect(screen.getByText(/In 2 tries/)).toBeDefined()
    const saved = JSON.parse(localStorage.getItem('dailyChallenge')!)
    expect(saved.streak).toBe(1)
    expect(saved.days[TODAY]).toEqual({ tries: 2, solved: true, revealed: false })
  })

  it('continues a streak from yesterday', () => {
    localStorage.setItem('dailyChallenge', JSON.stringify({
      days: { '2026-11-26': { tries: 1, solved: true, revealed: false } }, streak: 4, best: 4, lastSolved: '2026-11-26',
    }))
    const p = puzzleFor(TODAY)
    render(<DailyChallenge />)
    click(p.kind, winningMoves(p.kind, p.rows)[0])
    expect(screen.getByText(/5-day streak/)).toBeDefined()
  })

  it('shows the answer on request, without counting the day', () => {
    render(<DailyChallenge />)
    fireEvent.click(screen.getByRole('button', { name: 'Show a winning move' }))
    expect(screen.getByText('Answer shown.')).toBeDefined()
    expect(document.querySelectorAll('.nim-stone.hint').length).toBeGreaterThan(0)
    expect(JSON.parse(localStorage.getItem('dailyChallenge')!).streak).toBe(0)
  })
})

describe('Daily Challenge teaser', () => {
  it("invites the player to today's puzzle and shows the streak", () => {
    localStorage.setItem('dailyChallenge', JSON.stringify({
      days: {}, streak: 3, best: 3, lastSolved: '2026-11-26',
    }))
    render(<DailyTeaser />)
    expect(screen.getByText("Today: Wythoff's Nim")).toBeDefined()
    expect(screen.getByText(/3-day streak/)).toBeDefined()
    expect(screen.getByRole('link', { name: /Play today/ }).getAttribute('href')).toBe('/daily/')
  })
})
