import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import NimGame from '../nim/NimGame'
import ChompGame from '../chomp/ChompGame'

beforeEach(() => {
  localStorage.clear()
  window.history.pushState({}, '', '/nim/')
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const board = () => screen.getByRole('group', { name: 'Nim board' })
const tabStops = () => [...board().querySelectorAll('button')].filter(b => b.tabIndex === 0)

describe('board keyboard navigation', () => {
  it('puts one piece of the board in the tab order', () => {
    render(<NimGame />)
    expect(tabStops()).toHaveLength(1)
  })

  it('moves along a row and between rows with the arrow keys', () => {
    render(<NimGame />) // (3, 4, 5)
    const first = screen.getByRole('button', { name: 'Row 1: take 3 stones' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Row 1: take 2 stones' }))
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Row 2: take 3 stones' }))
    fireEvent.keyDown(document.activeElement!, { key: 'End' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Row 2: take 1 stone' }))
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Row 2: take 4 stones' }))
    expect(tabStops()).toEqual([document.activeElement])
  })

  it('keeps focus on the board after the stone in focus is taken', () => {
    render(<NimGame />)
    const stone = screen.getByRole('button', { name: 'Row 3: take 1 stone' })
    stone.focus()
    fireEvent.click(stone)
    fireEvent.click(screen.getByRole('button', { name: /Row 3: take 1 stone \(selected/ }))
    expect(board().contains(document.activeElement)).toBe(true)
    // During the computer's turn the stones stay focusable but can't be played.
    expect(document.activeElement).toHaveAttribute('aria-disabled', 'true')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(board().contains(document.activeElement)).toBe(true)
  })

  it('describes the board in words, and speaks it on D', () => {
    render(<NimGame />)
    expect(board()).toHaveAccessibleDescription('Row 1: 3 stones. Row 2: 4 stones. Row 3: 5 stones. Tally: unbalanced, odd 2\'s.')
    const stone = screen.getByRole('button', { name: 'Row 1: take 3 stones' })
    stone.focus()
    fireEvent.keyDown(stone, { key: 'd' })
    expect(document.querySelector('[aria-live="polite"].visually-hidden')?.textContent).toMatch(/^Row 1: 3 stones/)
  })

  it('works on a two-dimensional board (Chomp)', () => {
    render(<ChompGame />)
    const bar = screen.getByRole('group', { name: 'Chocolate bar' })
    const stops = [...bar.querySelectorAll('button')].filter(b => b.tabIndex === 0)
    expect(stops).toHaveLength(1)
    const top = screen.getByRole('button', { name: /^Bite at row 4, column 1:/ })
    top.focus()
    fireEvent.keyDown(top, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Bite at row 3, column 1:/ }))
  })
})
