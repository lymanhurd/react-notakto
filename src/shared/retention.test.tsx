import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import GrundyGame from '../grundy/GrundyGame'
import NimGame from '../nim/NimGame'
import SilverGame from '../silver/SilverGame'
import WythoffGame from '../wythoff/WythoffGame'
import ChompGame from '../chomp/ChompGame'
import Game from '../Game'
import { intParam, listParam, positionUrl } from './position'

function visit(path: string) {
  window.history.pushState({}, '', path)
}

beforeEach(() => {
  localStorage.clear()
  HTMLCanvasElement.prototype.getContext = () => null
})

afterEach(() => {
  cleanup()
  visit('/')
})

describe('position links', () => {
  it('reads and validates parameters', () => {
    visit('/nim/?rows=4,6,7&dots=12&bad=x')
    expect(listParam('rows', 1, 15, 6)).toEqual([4, 6, 7])
    expect(intParam('dots', 3, 30)).toBe(12)
    expect(intParam('dots', 3, 10)).toBeNull()
    expect(intParam('bad', 0, 99)).toBeNull()
    expect(intParam('missing', 0, 99)).toBeNull()
    visit('/nim/?rows=4,99')
    expect(listParam('rows', 1, 15, 6)).toBeNull()
  })

  it('builds a link to this page', () => {
    visit('/wythoff/')
    expect(positionUrl({ a: 7, b: 11 })).toBe(`${window.location.origin}/wythoff/?a=7&b=11`)
    expect(positionUrl({ rows: '4,6,7' })).toMatch(/\/wythoff\/\?rows=4,6,7$/)
  })

  it('opens Nim at a linked board', () => {
    visit('/nim/?rows=2,9')
    render(<NimGame />)
    expect(screen.getAllByRole('button', { name: /^Row 1: take/ })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /^Row 2: take/ })).toHaveLength(9)
  })

  it("opens Grundy's Game, Wythoff's Nim and Chomp at linked sizes", () => {
    visit('/grundy/?dots=11')
    render(<GrundyGame />)
    expect(screen.getByText('11 dots')).toBeDefined()
    cleanup()

    visit('/wythoff/?a=3&b=9')
    render(<WythoffGame />)
    expect(screen.getByLabelText('Marker at (3, 9)')).toBeDefined()
    cleanup()

    visit('/chomp/?rows=2&cols=5')
    render(<ChompGame />)
    expect(screen.getByText('2 rows')).toBeDefined()
    expect(screen.getByText('5 columns')).toBeDefined()
  })

  it('opens the Silver Dollar Game with linked coins', () => {
    visit('/silver/?coins=2,5,9&squares=10')
    render(<SilverGame />)
    expect(screen.getByText('3 coins')).toBeDefined()
    expect(screen.getByText('10 squares')).toBeDefined()
  })

  it('opens NoTakTo with a linked number of boards, replacing a saved game', () => {
    localStorage.setItem('notaktoSession', JSON.stringify({
      gameState: { lastWinner: null }, stats: { humanWins: 2, computerWins: 1 }, boards: ['----X----'],
    }))
    visit('/notakto/?boards=3')
    render(<Game />)
    expect(screen.getByText('3 boards')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
  })

  it('ignores a bad link', () => {
    visit('/grundy/?dots=999')
    render(<GrundyGame />)
    expect(screen.getByText('8 dots')).toBeDefined()
  })

  it('copies a link to the current setup', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    visit('/grundy/')
    render(<GrundyGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Fewer dots' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copy link to this setup' }))
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/grundy/?dots=7`)
    expect(await screen.findByRole('button', { name: 'Link copied!' })).toBeDefined()
  })
})

describe('progress is kept between visits', () => {
  it('saves the score in localStorage', () => {
    render(<GrundyGame />)
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole('button', { name: 'Fewer dots' }))
    fireEvent.click(screen.getByRole('button', { name: 'Split 3 into 1 and 2' }))
    expect(JSON.parse(localStorage.getItem('grundyStats')!)).toEqual({ humanWins: 1, computerWins: 0, cleanWins: 0, secondWins: 0 })
  })
})

describe('next steps after a game', () => {
  it('offers a harder setup and the next game after a win', () => {
    render(<GrundyGame />)
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole('button', { name: 'Fewer dots' }))
    fireEvent.click(screen.getByRole('button', { name: 'Split 3 into 1 and 2' }))
    const next = screen.getByRole('link', { name: /Try Chomp/ })
    expect(next.getAttribute('href')).toBe('/chomp/')
    expect(next.getAttribute('data-umami-event')).toBe('next-step-click')
    fireEvent.click(screen.getByRole('button', { name: 'Try 4 dots' }))
    expect(screen.getByText('4 dots')).toBeDefined()
    expect(screen.queryByText('You won!')).toBeNull()
  })

  it('points to the strategy after a loss', () => {
    localStorage.setItem('notaktoSession', JSON.stringify({
      gameState: { lastWinner: 'computer' }, stats: { humanWins: 0, computerWins: 1 }, boards: ['XXX------'],
    }))
    render(<Game />)
    expect(screen.getByRole('link', { name: 'How to win' }).getAttribute('href')).toBe('/discussion.html')
    expect(screen.queryByRole('button', { name: /^Try \d boards/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Try Nim/ })).toBeDefined()
  })

  it('suggests the next Nim preset after a win', () => {
    visit('/nim/?rows=1')
    render(<NimGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Row 1: take 1 stone' }))
    fireEvent.click(screen.getByRole('button', { name: 'Take 1' }))
    expect(screen.getByRole('button', { name: 'Try a random board' })).toBeDefined()
  })
})
