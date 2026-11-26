import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import KaylesGame from './KaylesGame'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const runLengths = () =>
  [...document.querySelectorAll('.kayles-run')].map(r => r.querySelectorAll('.pin').length)
const status = () => screen.getByRole('status').textContent ?? ''

describe('KaylesGame', () => {
  it('starts with one run of 10 pins', () => {
    render(<KaylesGame />)
    expect(runLengths()).toEqual([10])
  })

  it('knocking a pin splits the run, then the computer replies', () => {
    render(<KaylesGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Knock down pin 4' }))
    expect(runLengths()).toEqual([3, 6])
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(status()).toMatch(/The computer chose to knock down .* Your move\./)
  })

  it('the link knocks down two neighbors', () => {
    render(<KaylesGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Knock down pins 5 and 6' }))
    expect(runLengths()).toEqual([4, 4])
  })

  it('wins by knocking down the last pins', () => {
    render(<KaylesGame />)
    for (let i = 0; i < 8; i++) fireEvent.click(screen.getByRole('button', { name: 'Fewer pins' }))
    expect(runLengths()).toEqual([2])
    fireEvent.click(screen.getByRole('button', { name: 'Knock down pins 1 and 2' }))
    expect(screen.getByText('You won!')).toBeDefined()
  })
})
