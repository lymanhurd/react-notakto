import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import Game from './Game'

// Mock canvas getContext so jsdom doesn't throw
beforeEach(() => {
  localStorage.clear()

  HTMLCanvasElement.prototype.getContext = () => null
})

afterEach(() => {
  cleanup()
})

/** Seed localStorage as if a game had just finished. */
function seedFinishedGame(lastWinner: 'human' | 'computer') {
  localStorage.setItem(
    'notaktoSession',
    JSON.stringify({
      gameState: { lastWinner },
      stats: { humanWins: 0, computerWins: 0 },
      boards: ['XXx------'],
    })
  )
}

describe('Game', () => {
  it('renders the score display', () => {
    render(<Game />)
    expect(screen.getByText(/Human/i)).toBeDefined()
  })

  it('renders the board count buttons', () => {
    render(<Game />)
    expect(screen.getByRole('button', { name: /\+/ })).toBeDefined()
    expect(screen.getByRole('button', { name: /-/ })).toBeDefined()
  })

  it('renders the rules list', () => {
    render(<Game />)
    expect(screen.getByText(/Players take turns/i)).toBeDefined()
  })

  it('with an odd number of boards, hides Start and asks the player to move', () => {
    render(<Game />)
    expect(screen.queryByRole('button', { name: /Start/i })).toBeNull()
    expect(screen.getByRole('status').textContent).toMatch(/you move first/i)
  })

  it('with an even number of boards, shows Start and says the computer moves first', () => {
    render(<Game />)
    fireEvent.click(screen.getByRole('button', { name: /\+/ }))
    expect(screen.getByRole('button', { name: /Start/i })).toBeDefined()
    expect(screen.getByRole('status').textContent).toMatch(/computer moves first/i)
  })

  it('pressing Start lets the computer move and then prompts the player', () => {
    render(<Game />)
    fireEvent.click(screen.getByRole('button', { name: /\+/ }))
    fireEvent.click(screen.getByRole('button', { name: /Start/i }))
    expect(screen.getByRole('status').textContent).toMatch(/Your move/i)
    expect(screen.getByRole('button', { name: /Quit/i })).toBeDefined()
  })

  it('shows "You won!" when the human won the last game', () => {
    seedFinishedGame('human')
    render(<Game />)
    expect(screen.getByText('You won!')).toBeDefined()
    expect(screen.getByRole('button', { name: /Play Again/i })).toBeDefined()
  })

  it('shows a loss message when the computer won the last game', () => {
    seedFinishedGame('computer')
    render(<Game />)
    expect(screen.getByText(/The computer won/i)).toBeDefined()
  })

  it('Play Again clears the result banner', () => {
    seedFinishedGame('human')
    render(<Game />)
    fireEvent.click(screen.getByRole('button', { name: /Play Again/i }))
    expect(screen.queryByText('You won!')).toBeNull()
    expect(screen.getByRole('status').textContent).toMatch(/you move first/i)
  })

  it('Hint marks the winning squares, then clears them', () => {
    vi.useFakeTimers()
    render(<Game />)
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }))
    expect(screen.getByRole('note').textContent).toMatch(/leaves the computer in a losing position/)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.queryByRole('note')).toBeNull()
    vi.useRealTimers()
  })

  it('Hint says when there is no winning move', () => {
    localStorage.setItem('notaktoSession', JSON.stringify({
      gameState: { lastWinner: null }, stats: { humanWins: 0, computerWins: 0 }, boards: ['----x----'],
    }))
    render(<Game />)
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }))
    expect(screen.getByRole('note').textContent).toMatch(/no winning move/)
  })

  it('has no Hint button while waiting for the computer to start', () => {
    render(<Game />)
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    expect(screen.queryByRole('button', { name: 'Hint' })).toBeNull()
  })
})

describe('Game: keyboard and screen readers', () => {
  it('gives each square a button with a spoken label', () => {
    render(<Game />)
    expect(screen.getByRole('grid', { name: 'Board' })).toBeDefined()
    expect(screen.getAllByRole('button', { name: /: empty$/ })).toHaveLength(9)
    expect(screen.getByRole('button', { name: 'Center: empty' })).toBeDefined()
  })

  it('plays a square, then announces the computer\'s reply', () => {
    render(<Game />)
    fireEvent.click(screen.getByRole('button', { name: 'Center: empty' }))
    expect(screen.getByRole('button', { name: 'Center: X' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('status').textContent).toMatch(/^The computer played (top|middle|bottom|center).*Your move\.$/)
    expect(screen.getAllByRole('button', { name: /X, last move/ })).toHaveLength(1)
  })

  it('keeps one tab stop per board and moves with the arrow keys', () => {
    render(<Game />)
    const grid = screen.getByRole('grid')
    const tabbable = () => [...grid.querySelectorAll('button')].filter(b => b.tabIndex === 0)
    expect(tabbable()).toHaveLength(1)
    const first = tabbable()[0]
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Top middle: empty' }))
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Center: empty' }))
    expect(tabbable()).toHaveLength(1)
  })

  it('locks the squares until the computer starts on an even number of boards', () => {
    render(<Game />)
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    const square = screen.getAllByRole('button', { name: 'Center: empty' })[0]
    expect(square).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(square)
    expect(screen.getByRole('status').textContent).toMatch(/computer moves first/i)
  })

  it('describes a finished board', () => {
    localStorage.setItem('notaktoSession', JSON.stringify({
      gameState: { lastWinner: null }, stats: { humanWins: 0, computerWins: 0 }, boards: ['XXX------', '---------'],
    }))
    render(<Game />)
    expect(screen.getByRole('img', { name: /Board 1 of 2: finished.*X in top left, top middle and top right/ })).toBeDefined()
    expect(screen.getByRole('grid', { name: 'Board 2 of 2' })).toBeDefined()
  })
})
