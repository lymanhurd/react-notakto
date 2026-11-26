import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import WythoffGame from './WythoffGame'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const status = () => screen.getByRole('status').textContent ?? ''
const marker = () => screen.getByLabelText(/^Marker at/).getAttribute('aria-label')
const pileCounts = () => [...document.querySelectorAll('.wy-pile-count')].map(e => e.textContent)

describe('WythoffGame', () => {
  it('starts at (7, 11) and shows the grid and the piles together', () => {
    render(<WythoffGame />)
    expect(marker()).toBe('Marker at (7, 11)')
    expect(pileCounts()).toEqual(['7', '11'])
  })

  it('marks the special squares and asks about them only when asked', () => {
    render(<WythoffGame />)
    expect(document.querySelectorAll('.wy-cell.marked')).toHaveLength(0)
    expect(screen.queryByText(/significance of the marked squares/)).toBeNull()
    fireEvent.click(screen.getByLabelText('Mark special squares'))
    expect(document.querySelectorAll('.wy-cell.marked')).toHaveLength(13)
    expect(document.querySelector('.wy-lines')).not.toBeNull()
    expect(screen.getByText('What is the significance of the marked squares?')).toBeDefined()
    expect(screen.getByText('What are the slopes of the lines that connect them?')).toBeDefined()
  })

  it('moves on the grid and updates the piles, then the computer replies to a P square', () => {
    render(<WythoffGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Move to (5, 9)' }))
    expect(pileCounts()).toEqual(['5', '9'])
    expect(status()).toMatch(/computer will take/)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(status()).toMatch(/The computer chose to take .* Your move\./)
    fireEvent.click(screen.getByLabelText('Mark special squares'))
    expect(document.querySelector('.wy-cell.here')!.classList.contains('marked')).toBe(true)
  })

  it('takes stones from the left of a row, or the same number from both rows', () => {
    render(<WythoffGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Take 3 from pile B' }))
    expect(marker()).toBe('Marker at (7, 8)')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    cleanup()
    localStorage.clear()
    render(<WythoffGame />)
    expect(screen.getAllByRole('button', { name: /from both piles/ })).toHaveLength(7)
    fireEvent.click(screen.getByRole('button', { name: 'Take 2 from both piles' }))
    expect(marker()).toBe('Marker at (5, 9)')
  })

  it('offers only left, down and diagonal moves', () => {
    render(<WythoffGame />)
    const moves = screen.getAllByRole('button', { name: /^Move to/ })
    expect(moves).toHaveLength(7 + 11 + 7)
    expect(screen.queryByRole('button', { name: 'Move to (6, 9)' })).toBeNull()
  })

  it('wins when the player reaches (0, 0)', () => {
    render(<WythoffGame />)
    for (let i = 0; i < 7; i++) fireEvent.click(screen.getByRole('button', { name: 'Fewer in pile A' }))
    for (let i = 0; i < 9; i++) fireEvent.click(screen.getByRole('button', { name: 'Fewer in pile B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Move to (0, 0)' }))
    expect(screen.getByText('You won!')).toBeDefined()
  })

  it('hides the grid in Piles view', () => {
    render(<WythoffGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Piles' }))
    expect(document.querySelector('.wy-grid')).toBeNull()
    expect(pileCounts()).toHaveLength(2)
  })
})
