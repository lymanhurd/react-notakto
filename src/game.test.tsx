import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import Game from './Game'

// Mock canvas getContext so jsdom doesn't throw
beforeEach(() => {
  sessionStorage.clear()

  HTMLCanvasElement.prototype.getContext = () => null
})

afterEach(() => {
  cleanup()
})

describe('Game', () => {
  it('renders the score display', () => {
    render(<Game />)
    expect(screen.getByText(/Human:/i)).toBeDefined()
  })

  it('renders the Start button', () => {
    render(<Game />)
    expect(screen.getByRole('button', { name: /Start/i })).toBeDefined()
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
})
