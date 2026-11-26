import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import NimGame from './NimGame'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const status = () => screen.getByRole('status').textContent ?? ''
const rowCounts = () =>
  [...document.querySelectorAll('.nim-row')].map(r => r.querySelectorAll('.nim-stone').length)

describe('NimGame', () => {
  it('starts on the (3, 4, 5) sample board with clusters and tally shown', () => {
    render(<NimGame />)
    expect(rowCounts()).toEqual([3, 4, 5])
    expect(screen.getByText('5 = 4 + 1')).toBeDefined()
    expect(screen.getByText(/Unbalanced\./)).toBeDefined()
  })

  it('suggests letting the computer start on a balanced board', () => {
    render(<NimGame />)
    fireEvent.click(screen.getByRole('button', { name: /\(2, 4, 6\)/ }))
    expect(rowCounts()).toEqual([2, 4, 6])
    expect(status()).toMatch(/Let the computer go first/)
  })

  it('selects, then takes stones, and the computer replies by balancing', () => {
    render(<NimGame />)
    // Row 1 has 3 stones; the 2nd stone means "take 2" — the packet's winning move.
    const take2 = screen.getByRole('button', { name: 'Row 1: take 2 stones' })
    fireEvent.click(take2)
    expect(status()).toMatch(/Take 2 stones from row 1\?/)
    fireEvent.click(screen.getByRole('button', { name: 'Take 2' }))
    expect(rowCounts()).toEqual([1, 4, 5])
    expect(screen.getByText(/Balanced\./)).toBeDefined()

    // The computer must now unbalance the board; it moves after a short pause.
    expect(status()).toMatch(/computer is taking/)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(status()).toMatch(/The computer took .* Your move\./)
    expect(rowCounts().reduce((a, b) => a + b)).toBeLessThan(10)
  })

  it('hint points at the winning move', () => {
    render(<NimGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }))
    expect(screen.getByText(/2 stones from row 1/)).toBeDefined()
  })

  it('rejects an invalid custom board and accepts a valid one', () => {
    render(<NimGame />)
    const input = screen.getByLabelText('Your own board')
    fireEvent.change(input, { target: { value: '3, 0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Set up' }))
    expect(input.getAttribute('aria-invalid')).toBe('true')
    fireEvent.change(input, { target: { value: '1, 3, 5, 7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Set up' }))
    expect(rowCounts()).toEqual([1, 3, 5, 7])
  })

  it('shows "You won!" after taking the last stone', () => {
    render(<NimGame />)
    const input = screen.getByLabelText('Your own board')
    fireEvent.change(input, { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Set up' }))
    const all = screen.getByRole('button', { name: 'Row 1: take 4 stones' })
    fireEvent.click(all)
    fireEvent.click(all) // clicking the selected stone again confirms
    expect(screen.getByText('You won!')).toBeDefined()
  })
})
