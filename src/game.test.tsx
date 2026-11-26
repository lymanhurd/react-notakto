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
