import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import WythoffGame from './WythoffGame'

beforeEach(() => {
  sessionStorage.clear()
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
    expect(pileCounts()).toEqual(['7 stones', '11 stones'])
  })

  it('marks the P squares, including the corner', () => {
    render(<WythoffGame />)
    const pCells = document.querySelectorAll('.wy-cell.p')
    expect(pCells).toHaveLength(13)
    expect(document.querySelectorAll('.wy-cell.n')).toHaveLength(16 * 16 - 13)
  })

  it('moves on the grid and updates the piles, then the computer replies to a P square', () => {
    render(<WythoffGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Move to (5, 9)' }))
    expect(pileCounts()).toEqual(['5 stones', '9 stones'])
    expect(status()).toMatch(/computer will take/)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(status()).toMatch(/The computer chose to take .* Your move\./)
    expect(document.querySelector('.wy-cell.here')!.classList.contains('p')).toBe(true)
  })

  it('takes from a pile, or the same number from both', () => {
    render(<WythoffGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Take 3 from pile B' }))
    expect(marker()).toBe('Marker at (7, 8)')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    cleanup()
    sessionStorage.clear()
    render(<WythoffGame />)
    fireEvent.click(screen.getByLabelText('Take the same number from both piles'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Take 2 from both piles' })[0])
    expect(marker()).toBe('Marker at (5, 9)')
  })

  it('offers only left, down and diagonal moves', () => {
    render(<WythoffGame />)
    const moves = screen.getAllByRole('button', { name: /^Move to/ })
    expect(moves).toHaveLength(7 + 11 + 7)
    expect(screen.queryByRole('button', { name: 'Move to (6, 9)' })).toBeNull()
  })

  it('builds the marks one P square at a time', () => {
    render(<WythoffGame />)
    fireEvent.change(screen.getByLabelText(/squares/), { target: { value: 'build' } })
    expect(document.querySelectorAll('.wy-cell.p, .wy-cell.n')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(document.querySelectorAll('.wy-cell.p')).toHaveLength(1)
    expect(document.querySelectorAll('.wy-cell.n')).toHaveLength(45)
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(screen.getByText(/\(2, 1\) is the first blank square/)).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))
    expect(document.querySelectorAll('.wy-cell.p')).toHaveLength(13)
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
