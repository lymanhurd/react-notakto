import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import Privacy from './Privacy'
import SiteFooter from '../shared/SiteFooter'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('Privacy page', () => {
  it('states the essentials', () => {
    render(<Privacy />)
    expect(screen.getByText('No cookies.')).toBeDefined()
    expect(screen.getByText(/never leave your browser/)).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Anonymous visit counts' })).toBeDefined()
  })

  it('clears everything saved on this device', () => {
    localStorage.setItem('playerName', 'Ada')
    localStorage.setItem('nimStats', '{"humanWins":3,"computerWins":0}')
    render(<Privacy />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear my name and scores on this device' }))
    expect(localStorage.length).toBe(0)
    expect(screen.getByRole('status').textContent).toMatch(/removed/)
  })

  it('is linked from the footer', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/privacy/')
  })
})
