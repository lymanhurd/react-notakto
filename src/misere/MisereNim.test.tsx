import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import NimGame from '../nim/NimGame'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.history.pushState({}, '', '/')
})

const take = (row: number, n: number) => {
  fireEvent.click(screen.getByRole('button', { name: `Row ${row}: take ${n} ${n === 1 ? 'stone' : 'stones'}` }))
  fireEvent.click(screen.getByRole('button', { name: `Take ${n}` }))
}

describe('Misère Nim', () => {
  it('has its own title, presets and rules', () => {
    render(<NimGame misere />)
    expect(screen.getByRole('heading', { name: 'Misère Nim' })).toBeDefined()
    expect(screen.getByRole('button', { name: /Three singles/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Misère play' })).toBeDefined()
  })

  it('makes whoever takes the last stone lose', () => {
    window.history.pushState({}, '', '/misere-nim/?rows=1')
    render(<NimGame misere />)
    take(1, 1)
    expect(screen.getByText('The computer won.')).toBeDefined()
    expect(JSON.parse(localStorage.getItem('misereNimStats')!)).toEqual({ humanWins: 0, computerWins: 1 })
    expect(localStorage.getItem('nimStats')).toBeNull()
  })

  it('wins when the computer is left the last stone', () => {
    window.history.pushState({}, '', '/misere-nim/?rows=2')
    render(<NimGame misere />)
    take(1, 1)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('You won!')).toBeDefined()
    expect(screen.getByRole('link', { name: /Try NoTakTo/ })).toBeDefined()
  })

  it('hints the misère twist: leave an odd number of single stones', () => {
    window.history.pushState({}, '', '/misere-nim/?rows=1,1,3')
    render(<NimGame misere />)
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }))
    expect(screen.getByText(/2 stones from row 3/)).toBeDefined()
    expect(screen.getByText(/an odd number of single stones/)).toBeDefined()
  })
})
