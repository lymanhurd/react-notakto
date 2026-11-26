import { describe, it, expect } from 'vitest'
import { computerMove, isMisereSafe, MISERE_PRESETS, winningMoves } from './logic'

/** Brute force: in misère play, is the player to move losing? (The empty board: the opponent took the last stone, so you won.) */
function moverLoses(rows: number[], memo = new Map<string, boolean>()): boolean {
  const k = [...rows].sort((a, b) => a - b).join(',')
  if (memo.has(k)) return memo.get(k)!
  if (rows.every(n => n === 0)) return false
  let loses = true
  rows.forEach((n, i) => {
    for (let t = 1; t <= n && loses; t++) {
      const next = rows.map((m, j) => (j === i ? m - t : m))
      if (moverLoses(next, memo)) loses = false
    }
  })
  memo.set(k, loses)
  return loses
}

describe('Misère Nim', () => {
  it('matches a brute-force search on every board up to three rows of 7', () => {
    for (let a = 0; a <= 7; a++) for (let b = 0; b <= 7; b++) for (let c = 0; c <= 7; c++) {
      if (a + b + c === 0) continue
      expect(isMisereSafe([a, b, c])).toBe(moverLoses([a, b, c]))
    }
  })

  it('leaves an odd number of single stones at the end', () => {
    // Normal Nim would take all 3 from the last row; misère takes 2, leaving (1, 1, 1).
    expect(winningMoves([1, 1, 3], true)).toEqual([{ row: 2, take: 2 }])
    expect(winningMoves([1, 1, 3])).toEqual([{ row: 2, take: 3 }])
  })

  it('agrees with normal Nim while big rows remain', () => {
    expect(winningMoves([3, 4, 5], true)).toEqual(winningMoves([3, 4, 5]))
  })

  it('has no winning move from a safe board, and the computer takes one stone', () => {
    expect(winningMoves([1, 1, 1], true)).toEqual([])
    expect(computerMove([2, 2], () => 0, true)).toEqual({ row: 0, take: 1 })
    expect(computerMove([5], () => 0, true)).toEqual({ row: 0, take: 4 })
  })

  it('offers presets that are all playable boards', () => {
    expect(MISERE_PRESETS.length).toBeGreaterThan(3)
    expect(MISERE_PRESETS.every(p => p.rows.some(n => n > 0))).toBe(true)
  })
})
