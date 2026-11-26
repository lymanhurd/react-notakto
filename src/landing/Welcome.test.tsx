import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import Welcome from './Welcome'
import { cleanName, totalWins } from '../shared/player'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('Welcome', () => {
  it('asks a first-time visitor for a name, then greets them', () => {
    render(<Welcome />)
    fireEvent.change(screen.getByLabelText('What should we call you?'), { target: { value: '  Ada  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText(/Nice to meet you/).textContent).toBe('Nice to meet you, Ada!')
    expect(localStorage.getItem('playerName')).toBe('Ada')
  })

  it('welcomes a returning player by name, with their wins', () => {
    localStorage.setItem('playerName', 'Ada')
    localStorage.setItem('nimStats', JSON.stringify({ humanWins: 3, computerWins: 1 }))
    localStorage.setItem('notaktoSession', JSON.stringify({ stats: { humanWins: 2, computerWins: 0 }, boards: [] }))
    render(<Welcome />)
    expect(screen.getByText(/Welcome back/).textContent)
      .toBe("Welcome back, Ada! You've beaten the computer 5 times so far.")
  })

  it('does not ask again after "No thanks"', () => {
    render(<Welcome />)
    fireEvent.click(screen.getByRole('button', { name: 'No thanks' }))
    expect(screen.queryByLabelText('What should we call you?')).toBeNull()
    cleanup()
    render(<Welcome />)
    expect(screen.queryByLabelText('What should we call you?')).toBeNull()
  })

  it('lets someone else on the same device change the name', () => {
    localStorage.setItem('playerName', 'Ada')
    render(<Welcome />)
    fireEvent.click(screen.getByRole('button', { name: 'Not Ada?' }))
    expect(localStorage.getItem('playerName')).toBeNull()
    expect(screen.getByLabelText('What should we call you?')).toBeDefined()
  })

  it('does not save a blank name', () => {
    render(<Welcome />)
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('player helpers', () => {
  it('tidies names', () => {
    expect(cleanName('  Grace \n Hopper ')).toBe('Grace Hopper')
    expect(cleanName('x'.repeat(40))).toHaveLength(20)
  })

  it('ignores missing or broken stats', () => {
    localStorage.setItem('kaylesStats', 'not json')
    localStorage.setItem('chompStats', JSON.stringify({ humanWins: -4 }))
    expect(totalWins()).toBe(0)
  })
})
