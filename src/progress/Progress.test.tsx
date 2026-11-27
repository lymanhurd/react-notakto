import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act, within } from '@testing-library/react'
import Progress from './Progress'
import GrundyGame from '../grundy/GrundyGame'
import NimGame from '../nim/NimGame'
import { readRecord } from '../shared/player'

beforeEach(() => {
  localStorage.clear()
  HTMLCanvasElement.prototype.getContext = () => null
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.history.pushState({}, '', '/')
})

/** Win Grundy's Game from 3 dots in one split. */
function winGrundy() {
  render(<GrundyGame />)
  for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole('button', { name: 'Fewer dots' }))
  fireEvent.click(screen.getByRole('button', { name: /^Split 3 into 1 and 2/ }))
}

describe('wins without help', () => {
  it('counts a win with the helpers on as a helped win', () => {
    winGrundy()
    expect(readRecord('grundyStats')).toEqual({ wins: 1, cleanWins: 0, losses: 0 })
    expect(screen.getByText(/That win used help/)).toBeDefined()
  })

  it('counts a win with helpers off and no hint as a win without help', () => {
    localStorage.setItem('grundyPrefs', JSON.stringify({ size: 8, showValues: false, showTally: false }))
    winGrundy()
    expect(readRecord('grundyStats')).toEqual({ wins: 1, cleanWins: 1, losses: 0 })
    expect(screen.queryByText(/That win used help/)).toBeNull()
  })

  it('lets the player switch helpers off during setup', () => {
    render(<GrundyGame />)
    fireEvent.click(screen.getByLabelText('Show values'))
    fireEvent.click(screen.getByLabelText('Show tally'))
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole('button', { name: 'Fewer dots' }))
    fireEvent.click(screen.getByRole('button', { name: /^Split 3 into 1 and 2/ }))
    expect(readRecord('grundyStats').cleanWins).toBe(1)
  })

  it('does not count a win after pressing Hint', () => {
    localStorage.setItem('grundyPrefs', JSON.stringify({ size: 3, showValues: false, showTally: false }))
    render(<GrundyGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }))
    fireEvent.click(screen.getByRole('button', { name: /^Split 3 into 1 and 2/ }))
    expect(readRecord('grundyStats')).toEqual({ wins: 1, cleanWins: 0, losses: 0 })
  })

  it('does not count a helper switched on mid-game', () => {
    vi.useFakeTimers()
    localStorage.setItem('nimPrefs', JSON.stringify({ showClusters: false, showTally: false }))
    window.history.pushState({}, '', '/nim/?rows=2,1')
    render(<NimGame />)
    // (2, 1) -> take 1 from row 1 leaves (1, 1): Balanced.
    fireEvent.click(screen.getByRole('button', { name: 'Row 1: take 1 stone' }))
    fireEvent.click(screen.getByRole('button', { name: 'Take 1' }))
    fireEvent.click(screen.getByLabelText('Show clusters'))
    fireEvent.click(screen.getByLabelText('Show clusters'))
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    fireEvent.click(screen.getByRole('button', { name: /^Row \d: take 1 stone$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Take 1' }))
    expect(screen.getByText(/You won/)).toBeDefined()
    expect(JSON.parse(localStorage.getItem('nimStats')!)).toEqual({ humanWins: 1, computerWins: 0, cleanWins: 0 })
  })
})

describe('Progress page', () => {
  it('lists every game with its record and links to it', () => {
    localStorage.setItem('nimStats', JSON.stringify({ humanWins: 3, computerWins: 2, cleanWins: 1 }))
    localStorage.setItem('notaktoSession', JSON.stringify({ stats: { humanWins: 1, computerWins: 0 } }))
    render(<Progress />)
    const nim = screen.getByRole('link', { name: 'Nim' }).closest('tr')!
    expect([...nim.querySelectorAll('td')].slice(0, 3).map(td => td.textContent)).toEqual(['3', '1 ★', '2'])
    expect(screen.getByRole('link', { name: 'Nim' }).getAttribute('href')).toBe('/nim/')
    expect(screen.getAllByRole('row')).toHaveLength(1 + 8)
    expect(screen.getByText(/played/).textContent).toMatch(/2 of 8.*4 times.*1 of them without help/)
  })

  it('invites the player to try games they have not played', () => {
    localStorage.setItem('nimStats', JSON.stringify({ humanWins: 1, computerWins: 0 }))
    render(<Progress />)
    const chomp = screen.getByRole('link', { name: 'Chomp' }).closest('tr')!
    expect(chomp.className).toBe('untried')
    expect(within(chomp).getByText(/Not tried yet/)).toBeDefined()
    expect(screen.getByText(/Still to try:/).textContent).toMatch(/Chomp/)
  })

  it('uses the player name in the heading', () => {
    localStorage.setItem('playerName', 'Ada')
    render(<Progress />)
    expect(screen.getByRole('heading', { name: "Ada's progress" })).toBeDefined()
  })

  it('treats old scores without a clean-win count as zero', () => {
    localStorage.setItem('kaylesStats', JSON.stringify({ humanWins: 4, computerWins: 1 }))
    expect(readRecord('kaylesStats')).toEqual({ wins: 4, cleanWins: 0, losses: 1 })
  })
})
