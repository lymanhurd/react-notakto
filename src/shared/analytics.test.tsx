import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import GrundyGame from '../grundy/GrundyGame'
import SiteFooter from './SiteFooter'
import Landing from '../landing/Landing'
import { track } from './analytics'

const trackSpy = vi.fn()

beforeEach(() => {
  localStorage.clear()
  trackSpy.mockReset()
  window.umami = { track: trackSpy }
})

afterEach(() => {
  cleanup()
  delete window.umami
})

describe('analytics', () => {
  it('does nothing (and does not throw) when Umami is not loaded', () => {
    delete window.umami
    expect(() => track('anything')).not.toThrow()
  })

  it('records a game start and a human win', () => {
    render(<GrundyGame />)
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole('button', { name: 'Fewer dots' }))
    fireEvent.click(screen.getByRole('button', { name: 'Split 3 into 1 and 2' }))
    expect(trackSpy).toHaveBeenCalledWith('game-start', { game: 'grundy', first: 'human', board: '3 dots' })
    expect(trackSpy).toHaveBeenCalledWith('game-end', { game: 'grundy', winner: 'human' })
  })

  it('records "Computer moves first" as the start', () => {
    render(<GrundyGame />)
    fireEvent.click(screen.getByRole('button', { name: 'Computer moves first' }))
    expect(trackSpy).toHaveBeenCalledWith('game-start', { game: 'grundy', first: 'computer', board: '8 dots' })
  })

  it('tags every store link with a store-click event and its location', () => {
    render(<Landing />)
    const home = [...document.querySelectorAll('a[href*="teacherspayteachers.com"]')]
    expect(home.map(a => a.getAttribute('data-umami-event-location'))).toEqual(['home-nav', 'home-header', 'home-panel'])
    expect(home.every(a => a.getAttribute('data-umami-event') === 'store-click')).toBe(true)
    expect(home.every(a => a.getAttribute('href')!.includes('utm_source=lymanslogicgames.com'))).toBe(true)
    cleanup()

    window.history.pushState({}, '', '/nim/')
    render(<SiteFooter />)
    const note = document.querySelector('a.store-note-link')!
    expect(note.getAttribute('data-umami-event')).toBe('store-click')
    expect(note.getAttribute('data-umami-event-location')).toBe('game-page:nim')
    window.history.pushState({}, '', '/')
  })

  it('tags contact links with a contact-click event and points them at the contact address', () => {
    render(<Landing />)
    const links = [...document.querySelectorAll('a[href="mailto:lyman@lymanslogicgames.com"]')]
    expect(links.map(a => a.getAttribute('data-umami-event-location'))).toEqual(['home-contact', 'footer:home'])
    expect(links.every(a => a.getAttribute('data-umami-event') === 'contact-click')).toBe(true)
  })
})
