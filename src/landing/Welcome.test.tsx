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
    expect(totalWins(['kaylesStats', 'chompStats', 'missingStats'])).toBe(0)
  })
})

describe('the name on game pages', () => {
  it('labels the scoreboard and the win banner with the name', async () => {
    localStorage.setItem('playerName', 'Ada')
    const { default: GrundyGame } = await import('../grundy/GrundyGame')
    render(<GrundyGame />)
    expect(screen.getByText('Ada')).toBeDefined()
    expect(screen.queryByText('Human')).toBeNull()
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole('button', { name: 'Fewer dots' }))
    fireEvent.click(screen.getByRole('button', { name: 'Split 3 into 1 and 2' }))
    expect(screen.getByText('You won, Ada!')).toBeDefined()
  })

  it('names the player in Nim and NoTakTo too', async () => {
    localStorage.setItem('playerName', 'Ada')
    localStorage.setItem('notaktoSession', JSON.stringify({
      gameState: { lastWinner: 'human' }, stats: { humanWins: 1, computerWins: 0 }, boards: ['XXX------'],
    }))
    HTMLCanvasElement.prototype.getContext = () => null
    const { default: Game } = await import('../Game')
    render(<Game />)
    expect(screen.getByText('You won, Ada!')).toBeDefined()
    expect(screen.getByText('Ada')).toBeDefined()
    cleanup()
    const { default: NimGame } = await import('../nim/NimGame')
    render(<NimGame />)
    expect(screen.getByText('Ada')).toBeDefined()
  })

  it('still says "Human" without a name', async () => {
    const { default: GrundyGame } = await import('../grundy/GrundyGame')
    render(<GrundyGame />)
    expect(screen.getByText('Human')).toBeDefined()
  })
})
