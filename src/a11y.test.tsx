import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import axe from 'axe-core'
import type { ReactElement } from 'react'
import App from './App'
import NimGame from './nim/NimGame'
import WythoffGame from './wythoff/WythoffGame'
import SilverGame from './silver/SilverGame'
import ChompGame from './chomp/ChompGame'
import KaylesGame from './kayles/KaylesGame'
import GrundyGame from './grundy/GrundyGame'
import DailyChallenge from './daily/DailyChallenge'
import Progress from './progress/Progress'
import Privacy from './privacy/Privacy'
import Landing from './landing/Landing'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

/**
 * Automated WCAG A/AA checks with axe-core. jsdom has no layout, so color contrast,
 * target size and reflow are not checked here; they need a real browser.
 */
async function violations(ui: ReactElement) {
  const { container } = render(ui)
  const result = await axe.run(container, {
    runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    rules: { 'color-contrast': { enabled: false } },
  })
  return result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)
}

const pages: [string, () => ReactElement][] = [
  ['Notakto', () => <App />],
  ['Nim', () => <NimGame />],
  ['Misère Nim', () => <NimGame misere />],
  ["Wythoff's Nim", () => <WythoffGame />],
  ['Silver Dollar', () => <SilverGame />],
  ['Chomp', () => <ChompGame />],
  ['Kayles', () => <KaylesGame />],
  ["Grundy's Game", () => <GrundyGame />],
  ['Daily Challenge', () => <DailyChallenge />],
  ['Progress', () => <Progress />],
  ['Privacy', () => <Privacy />],
  ['Landing', () => <Landing />],
]

describe('accessibility (axe-core)', () => {
  it.each(pages)('%s has no detectable WCAG A/AA violations', async (_name, ui) => {
    expect(await violations(ui())).toEqual([])
  })
})
