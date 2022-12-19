import { isWinning } from './monoid';

/**
 * computerMove(boards) - given the current position represented as an array of strings,
 * return a new position wit the computer's move
 * 
 * 
 * @param {Array<string>} boards
 * 
 * @returns {Array<string>}
 */
export function computerMove(boards) {
    const numSquares = 9 * boards.length;
    const startingSquare = Math.floor(Math.random() * numSquares);
    // If the human player is winning, there is no "winning" move for the
    // computer and it should return a random legal move.
    const findAvailable = isWinning(boards);
    for (let i = 0; i < numSquares; i++) {
        const square = (i + startingSquare) % numSquares;
        const idx = Math.floor(square / 9);
        if (isDead(boards[idx])) {
            continue;
        }
        const sqNum = square % 9;
        if (boards[idx][sqNum] === '-') {
            const test = mkMove(boards, idx, sqNum, "x");
            if (findAvailable) {
                return [test, false];
            }
            if (isWinning(test)) {
                return [test, true];
            }
        }
    }
    // Getting here means that there were no open spaces which should have been caught earlier, or
    // that the game has evaluated to a win for the computer but we cannot find a "winning" move which
    // should be mathematically impossible
    console.log("Monoid Error: This should not be possible.");
}

/**
 * 
 * @param {Array<string>} board
 * 
 * @returns {boolean}
 */
export function isDead(board) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if ((board.charAt(a) !== "-") && (board.charAt(b) !== "-") && (board.charAt(c) !== "-")) {
        return true;
      }
    }
    return false;
}

/**
 * 
 * @param {Array<string>} board
 * 
 * @returns {boolean}
 */
export function isStart(boards) {
    return boards.every((b) =>b === "---------");
}

/**
 * 
 * @param {Array<string>} boards
 * 
 * @returns {boolean}
 */
export function isGameOver(boards) {
    return boards.every((b) =>isDead(b));
}

/**
 * 
 * @param {Array<string>} boards 
 * @param {number} idx 
 * @param {number} squareNum
 * 
 * @returns {Array<string>?}
 */
export function humanMove(boards, idx, squareNum) {
    if ((boards[idx][squareNum] !== '-') || (isDead(boards[idx]))) {
        return null;
    }
    return mkMove(boards, idx, squareNum, "X");
}

/**
 * 
 * @param {Array<string>} boards 
 * @param {number} idx 
 * @param {number} squareNum 
 * @param {string} symbol
 * 
 * @returns {Array<string>}
 */
function mkMove(boards, idx, squareNum, symbol) {
    let newBoards = boards.slice();
    newBoards[idx] = boards[idx].substring(0, squareNum) + symbol + boards[idx].substring(squareNum + 1);
    return newBoards;
}