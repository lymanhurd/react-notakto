import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import axe from 'axe-core'
import Game from './Game'
import { boardValue, monoidProduct, isPPosition, ELEMENT_NAMES, isWinning } from './monoid'
import { isDead } from './logic'

beforeEach(() => {
  localStorage.clear()
  HTMLCanvasElement.prototype.getContext = () => null
})
afterEach(() => cleanup())

const allBoards = Array.from({ length: 512 }, (_, m) =>
  Array.from({ length: 9 }, (_, i) => (m >> i) & 1 ? 'X' : '-').join(''))

describe('monoid helpers', () => {
  it('gives every finished board the identity', () => {
    for (const b of allBoards.filter(isDead)) expect(boardValue(b)).toBe(0)
  })

  it('matches the known values of simple positions', () => {
    expect(ELEMENT_NAMES[boardValue('---------')]).toBe('c')
    expect(ELEMENT_NAMES[boardValue('----X----')]).toBe('c²')
    expect(ELEMENT_NAMES[boardValue('X--------')]).toBe('1')
    expect(ELEMENT_NAMES[boardValue('-X-------')]).toBe('1')
    expect(ELEMENT_NAMES[monoidProduct(['---------', '---------'])]).toBe('c²')
  })

  it('agrees with the P-positions the computer plays toward', () => {
    expect(ELEMENT_NAMES.filter((_, i) => isPPosition(i))).toEqual(['a', 'b²', 'bc', 'c²'])
    const live = allBoards.filter(b => !isDead(b))
    for (const b of live.slice(0, 40)) {
      for (const c of live.slice(0, 40)) {
        expect(isPPosition(monoidProduct([b, c]))).toBe(isWinning([b, c]))
      }
    }
  })
})

describe('Show monoid values', () => {
  it('is off by default and shows values, product and relations when checked', () => {
    render(<Game />)
    expect(screen.queryByRole('heading', { name: 'Monoid values' })).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show monoid values' }))
    expect(screen.getByRole('heading', { name: 'Monoid values' })).toBeDefined()
    // One empty board: value c, an N-position.
    expect(document.querySelector('.board-value')?.textContent).toContain('c')
    expect(screen.getByText('N-position')).toBeDefined()
    expect(screen.getByText('Relations that define the monoid')).toBeDefined()
    // The board grid is described by its value.
    const grid = screen.getByRole('grid', { name: 'Board' })
    expect(grid.getAttribute('aria-describedby')).toBe('board-value-0')
  })

  it('labels two empty boards as a P-position', () => {
    render(<Game />)
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show monoid values' }))
    const panel = screen.getByRole('region', { name: 'Monoid values' })
    expect(within(panel).getByText('P-position')).toBeDefined()
  })

  it('remembers the setting', () => {
    render(<Game />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show monoid values' }))
    cleanup()
    render(<Game />)
    expect((screen.getByRole('checkbox', { name: 'Show monoid values' }) as HTMLInputElement).checked).toBe(true)
  })

  it('has no detectable WCAG A/AA violations when on', async () => {
    const { container } = render(<Game />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show monoid values' }))
    const result = await axe.run(container, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(result.violations.map(v => v.id)).toEqual([])
  })
})
