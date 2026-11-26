import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import GrundyGame from './GrundyGame'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const groupSizes = () =>
  [...document.querySelectorAll('.grundy-group')].map(g => g.querySelectorAll('.dot').length)
const status = () => screen.getByRole('status').textContent ?? ''

describe('GrundyGame', () => {
  it('starts with one group of 8 dots and its value', () => {
    render(<GrundyGame />)
    expect(groupSizes()).toEqual([8])
    expect(screen.getByLabelText('value 2')).toBeDefined()
  })

  it('does not allow an equal split', () => {
    render(<GrundyGame />)
    expect((screen.getByRole('button', { name: "Can't split 8 into equal halves" }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('splits a group, then the computer replies', () => {
    render(<GrundyGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Split 8 into 3 and 5' }))
    expect(groupSizes()).toEqual([3, 5])
    expect(status()).toMatch(/computer will split/)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(groupSizes()).toHaveLength(3)
    expect(status()).toMatch(/Your move\./)
  })

  it('the stepper changes the number of dots during setup', () => {
    render(<GrundyGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Fewer dots' }))
    expect(groupSizes()).toEqual([7])
    // 7 has value 0, so the setup tip suggests letting the computer start
    expect(status()).toMatch(/Let the computer go first/)
  })

  it('wins by making the last split', () => {
    render(<GrundyGame />)
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole('button', { name: 'Fewer dots' }))
    expect(groupSizes()).toEqual([3])
    fireEvent.click(screen.getByRole('button', { name: 'Split 3 into 1 and 2' }))
    expect(screen.getByText('You won!')).toBeDefined()
  })

  it('hides sizes 13 and up until the pattern reveal', () => {
    render(<GrundyGame />)
    expect(screen.queryByLabelText('3, not 0')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Click for answer' }))
    expect(screen.getAllByLabelText('3, not 0').length).toBe(2)
    expect(screen.getByText(/no pattern has turned up since/)).toBeDefined()
  })
})
