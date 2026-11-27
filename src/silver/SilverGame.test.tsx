import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import SilverGame from './SilverGame'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  window.history.pushState({}, '', '/')
})

/** Squares (1-based) that hold a coin. */
const coinSquares = () =>
  [...document.querySelectorAll('.coin')].map(c =>
    Number(c.getAttribute('aria-label')!.match(/square (\d+)/)![1]))
const status = () => screen.getByRole('status').textContent ?? ''

/**
 * Start with 2 coins on squares 1 and 6 of 6. Random starts never put a coin beside the star,
 * so this position comes from a link (explicit setups may have empty gaps).
 */
function renderTwoCoins(showGaps = false) {
  localStorage.setItem('silverPrefs', JSON.stringify({ coins: 2, squares: 6, showGaps, showTally: true }))
  window.history.pushState({}, '', '/silver/?coins=1,6&squares=6')
  render(<SilverGame />)
}

describe('SilverGame', () => {
  it('plays normally without the Nim view by default', () => {
    renderTwoCoins()
    expect(coinSquares()).toHaveLength(2)
    expect(document.querySelector('.coin.trailing, .coin.leading')).toBeNull()
    // Every coin is drawn as a quarter.
    expect(document.querySelectorAll('.coin.quarter')).toHaveLength(2)
    for (const img of document.querySelectorAll('.coin img')) {
      expect(img.getAttribute('src')).toBe('/images/coins/quarter.png')
    }
    expect(document.querySelector('.pair-bracket')).toBeNull()
    expect(screen.queryByText('Gap tally')).toBeNull()
  })

  it('the Nim view colors coins, brackets each pair and shows the tally', () => {
    renderTwoCoins(true)
    expect(document.querySelectorAll('.coin.trailing')).toHaveLength(1)
    expect(document.querySelectorAll('.coin.leading')).toHaveLength(1)
    // Trailing (silver) coins are dimes and leading (copper) coins are pennies; no quarters.
    expect(document.querySelectorAll('.coin.trailing.dime')).toHaveLength(1)
    expect(document.querySelectorAll('.coin.leading.penny')).toHaveLength(1)
    expect(document.querySelector('.coin.quarter')).toBeNull()
    expect(document.querySelector('.coin.dime img')?.getAttribute('src')).toBe('/images/coins/dime.png')
    expect(document.querySelector('.coin.penny img')?.getAttribute('src')).toBe('/images/coins/penny.png')
    expect(document.querySelectorAll('.pair-bracket')).toHaveLength(1)
    expect(screen.getByText('Gap tally')).toBeDefined()
  })

  it('picks up a coin, highlights its destinations, and slides it', () => {
    renderTwoCoins()
    expect(coinSquares()).toEqual([1, 6])
    // The coin on square 1 is already against the star and can't move.
    fireEvent.click(screen.getByRole('button', { name: 'Coin on square 1' }))
    expect(screen.queryAllByRole('button', { name: /Slide to square/ })).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Coin on square 6' }))
    expect(status()).toMatch(/picked up/)
    // It can slide to squares 2–5 but not onto or past the coin on square 1.
    expect(screen.getAllByRole('button', { name: /Slide to square/ })).toHaveLength(4)
    fireEvent.click(screen.getByRole('button', { name: 'Slide to square 3' }))
    expect(coinSquares()).toEqual([1, 3])
    // The computer replies after a pause.
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(status()).toMatch(/Your move\.|won/)
  })

  it('the hint stays visible while the hinted coin is picked up', () => {
    renderTwoCoins()
    // Coins on 1 and 6: piles [4], so the winning move is 6 → 2 (empty the pile).
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }))
    expect(screen.getByText(/slide the coin on square 6 to square 2/)).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Coin on square 6, hint: move this coin' }))
    expect(document.querySelector('.cell.hint-target .target-btn')?.getAttribute('aria-label')).toBe('Slide to square 2, hint')
  })

  it('stepper and Shuffle change the setup', () => {
    renderTwoCoins()
    fireEvent.click(screen.getByRole('button', { name: 'More coins' }))
    expect(coinSquares()).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Shuffle' }))
    expect(coinSquares()).toHaveLength(3)
  })

  it('random starts leave a gap in front of every coin, with enough squares for it', () => {
    localStorage.setItem('silverPrefs', JSON.stringify({ coins: 4, squares: 5, showGaps: false, showTally: true }))
    render(<SilverGame />)
    // Saved settings with too few squares are widened to 2 per coin.
    expect(screen.getByText('8 squares')).toBeDefined()
    expect((screen.getByRole('button', { name: 'Fewer squares' }) as HTMLButtonElement).disabled).toBe(true)
    for (let i = 0; i < 20; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Shuffle' }))
      const squares = coinSquares()
      expect(squares[0]).toBeGreaterThanOrEqual(2)
      for (let k = 1; k < squares.length; k++) expect(squares[k] - squares[k - 1]).toBeGreaterThanOrEqual(2)
    }
    fireEvent.click(screen.getByRole('button', { name: 'More coins' }))
    expect(screen.getByText('10 squares')).toBeDefined()
  })
})
