import { describe, it, expect } from 'vitest'
import { computerMove, isDead } from './logic'
import { isWinning } from './monoid'

/** Index of the board the move was played on (the one holding the new lowercase 'x'). */
const movedBoard = (after: string[]) => after.findIndex(b => b.includes('x'))

describe('computerMove', () => {
  it('plays a winning move when one exists', () => {
    for (let i = 0; i < 20; i++) {
      expect(computerMove(['---------'])).toEqual(['----x----'])
    }
  })

  it('avoids killing a board when it has no winning move', () => {
    // The computer is losing here. Squares 1, 6 and 8 kill the board; 3, 5 and 7 don't.
    const boards = ['X-X-X----']
    expect(isWinning(boards)).toBe(true)
    for (let i = 0; i < 50; i++) {
      const after = computerMove(boards)!
      expect(isDead(after[movedBoard(after)])).toBe(false)
    }
  })

  it('prefers a move on another board over killing one', () => {
    // The computer is losing. Every square on board 0 kills it, but boards 2 and 3 have safe squares.
    const boards = ['XX-XX----', 'XXX------', 'X-X-X----', '----X----']
    expect(isWinning(boards)).toBe(true)
    for (let i = 0; i < 50; i++) {
      const after = computerMove(boards)!
      const idx = movedBoard(after)
      expect(isDead(after[idx])).toBe(false)
    }
  })

  it('kills a board when every legal move does', () => {
    const after = computerMove(['XX-XX----'])!
    expect(after).toBeDefined()
    expect(isDead(after[0])).toBe(true)
  })
})
