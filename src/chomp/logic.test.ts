import { describe, it, expect } from 'vitest'
import {
  applyMove,
  biteSize,
  clampSize,
  computerMove,
  cornerSquares,
  isGameOver,
  isLegal,
  isWinning,
  label,
  legalMoves,
  MAX_COLS,
  MAX_ROWS,
  rectangle,
  winningMoves,
} from './logic'

describe('Chomp logic', () => {
  it('bites a square and everything above and to its right', () => {
    const board = rectangle({ rows: 4, cols: 7 })
    expect(applyMove(board, { row: 2, col: 3 })).toEqual([7, 7, 3, 3])
    expect(biteSize(board, { row: 2, col: 3 })).toBe(8)
    expect(applyMove([5, 3, 2], { row: 0, col: 1 })).toEqual([1, 1, 1])
  })

  it('never lets anyone bite the poisoned square or an eaten one', () => {
    expect(isLegal([3, 2], { row: 0, col: 0 })).toBe(false)
    expect(isLegal([3, 2], { row: 1, col: 2 })).toBe(false)
    expect(() => applyMove([3, 2], { row: 0, col: 0 })).toThrow()
    expect(legalMoves([3, 2])).toHaveLength(4)
  })

  it('is over when only the poisoned square is left', () => {
    expect(isGameOver([1, 0, 0])).toBe(true)
    expect(isGameOver([2, 0])).toBe(false)
    expect(isGameOver([1, 1])).toBe(false)
    expect(isWinning([1, 0])).toBe(false)
  })

  it('labels positions top to bottom, as in the lookup table', () => {
    expect(label([7, 7, 3, 3])).toBe('(3, 3, 7, 7)')
    expect(label([4, 2, 0])).toBe('(2, 4)')
  })

  it('finds the one-pager opening for 4 × 7: chomp the 2 × 4 block in the upper right', () => {
    const board = rectangle({ rows: 4, cols: 7 })
    expect(isWinning([7, 7, 3, 3])).toBe(false)
    expect(winningMoves(board)).toContainEqual({ row: 2, col: 3 })
  })

  it('wins every rectangle for the first player (strategy stealing)', () => {
    for (let rows = 1; rows <= 5; rows++) {
      for (let cols = 2; cols <= 6; cols++) {
        expect(isWinning(rectangle({ rows, cols }))).toBe(true)
      }
    }
  })

  it('on a square board, leaves an L with equal arms', () => {
    expect(winningMoves(rectangle({ rows: 5, cols: 5 }))).toEqual([{ row: 1, col: 1 }])
    for (let n = 1; n <= 6; n++) {
      // An L with arms of n squares each side of the poison.
      expect(isWinning([n + 1, ...Array(n).fill(1)])).toBe(false)
    }
  })

  it('on two rows, keeps the bottom row one longer than the top', () => {
    for (let n = 2; n <= MAX_COLS; n++) {
      expect(isWinning([n, n - 1])).toBe(false)
      expect(winningMoves([n, n])).toEqual([{ row: 1, col: n - 1 }])
    }
  })

  it('solves the largest board offered quickly', () => {
    const start = performance.now()
    expect(isWinning(rectangle({ rows: MAX_ROWS, cols: MAX_COLS }))).toBe(true)
    expect(performance.now() - start).toBeLessThan(5000)
  })

  it('the computer plays a winning bite when there is one', () => {
    const board = rectangle({ rows: 4, cols: 7 })
    for (const r of [0, 0.5, 0.99]) {
      const move = computerMove(board, () => r)!
      expect(isWinning(applyMove(board, move))).toBe(false)
    }
  })

  it('otherwise nibbles a single corner square', () => {
    const board = [7, 7, 3, 3]
    expect(cornerSquares(board)).toEqual([{ row: 1, col: 6 }, { row: 3, col: 2 }])
    const move = computerMove(board, () => 0)!
    expect(biteSize(board, move)).toBe(1)
    expect(computerMove([1, 0], () => 0)).toBeNull()
  })

  it('keeps board sizes in range', () => {
    expect(clampSize({ rows: 0, cols: 1 })).toEqual({ rows: 1, cols: 2 })
    expect(clampSize({ rows: 99, cols: 99 })).toEqual({ rows: MAX_ROWS, cols: MAX_COLS })
  })
})
