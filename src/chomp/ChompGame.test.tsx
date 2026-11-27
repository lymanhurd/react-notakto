import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import ChompGame from './ChompGame'
import * as analytics from '../shared/analytics'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const status = () => screen.getByRole('status').textContent ?? ''
const squares = () => document.querySelectorAll('.ch-cell.square').length
const bite = (row: number, col: number) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Bite at row ${row}, column ${col}:`) }))

describe('ChompGame', () => {
  it('starts on the 4 × 7 bar with the poisoned square nailed down', () => {
    render(<ChompGame />)
    expect(squares()).toBe(27)
    expect(screen.getByRole('img', { name: /Poisoned square/ })).toBeDefined()
    expect(screen.queryByRole('button', { name: /^Bite at row 1, column 1:/ })).toBeNull()
  })

  it('previews a bite on hover and eats the block on click; the computer replies', () => {
    const start = vi.spyOn(analytics, 'trackGameStart')
    render(<ChompGame />)
    const target = screen.getByRole('button', { name: /^Bite at row 3, column 4:/ })
    fireEvent.mouseEnter(target)
    expect(status()).toMatch(/eat 8 squares, leaving \(3, 3, 7, 7\)/)
    expect(document.querySelectorAll('.ch-cell.preview')).toHaveLength(8)
    fireEvent.click(target)
    expect(squares()).toBe(19)
    expect(start).toHaveBeenCalledWith('chomp', 'human', '4 × 7')

    expect(status()).toMatch(/computer is biting/)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(status()).toMatch(/The computer ate \d+ squares?\. Your move\./)
    expect(squares()).toBeLessThan(19)
  })

  it('shows the position label and a hint for the winning bite', () => {
    render(<ChompGame />)
    fireEvent.click(screen.getByLabelText('Show position label'))
    expect(screen.getByText('(7, 7, 7, 7)')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }))
    expect(screen.getByText(/Hint: bite at/)).toBeDefined()
    expect(document.querySelectorAll('.ch-cell.hint').length).toBeGreaterThan(0)
  })

  it('changes the bar size from the presets and steppers', () => {
    render(<ChompGame />)
    fireEvent.click(screen.getByRole('button', { name: /5 × 5/ }))
    expect(squares()).toBe(24)
    fireEvent.click(screen.getByRole('button', { name: 'Fewer rows' }))
    expect(squares()).toBe(19)
    fireEvent.click(screen.getByRole('button', { name: 'More columns' }))
    expect(squares()).toBe(23)
  })

  it('declares a win for eating the last good square', () => {
    const end = vi.spyOn(analytics, 'trackGameEnd')
    render(<ChompGame />)
    fireEvent.click(screen.getByRole('button', { name: /2 × 6/ }))
    // Shrink to one row of two squares: the only bite wins.
    fireEvent.click(screen.getByRole('button', { name: 'Fewer rows' }))
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: 'Fewer columns' }))
    expect(squares()).toBe(1)
    bite(1, 2)
    expect(screen.getByText('You won!')).toBeDefined()
    expect(end).toHaveBeenCalledWith('chomp', 'human')
  })

  it('the computer moving first wins with a perfect bite', () => {
    render(<ChompGame />)
    fireEvent.click(screen.getByRole('button', { name: /5 × 5/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Computer moves first' }))
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    // The only winning bite on a square bar leaves an L with equal arms.
    expect(squares()).toBe(8)
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }))
    expect(screen.getByText(/no winning bite/)).toBeDefined()
  })
})
