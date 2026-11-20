import { describe, it, expect } from 'vitest'
import { winningMoves } from './logic'
import { isWinning } from './monoid'

describe('winningMoves', () => {
  it('finds the center as the only winning first move on one board', () => {
    expect(winningMoves(['---------'])).toEqual([{ board: 0, square: 4 }])
  })

  it('finds none from a position that is already winning for the opponent', () => {
    // After the center is played, the player to move has no winning reply.
    const boards = ['----x----']
    expect(isWinning(boards)).toBe(true)
    expect(winningMoves(boards)).toEqual([])
  })

  it('never suggests killing the last board', () => {
    // Square 2 completes the top row and kills the only board, so it loses.
    const boards = ['XX-------']
    const moves = winningMoves(boards)
    expect(moves.some(m => m.square === 2)).toBe(false)
  })

  it('only suggests moves on live boards', () => {
    const moves = winningMoves(['XXX------', '---------'])
    expect(moves.every(m => m.board === 1)).toBe(true)
  })
})
