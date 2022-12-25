import { isWinning } from './monoid';

/**
 * computerMove(boards) - given the current position represented as an array of strings,
 * return a new position with the computer's move
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
      const test = mkMove(boards, idx, sqNum);
      // a possible improvement would be to try not to kill off any boards when making moves
      // at random to proloing the game and give the human a chance to make mistakes
      if (findAvailable|| isWinning(test)) {
          return test;
      }
    }
  }
  // Getting here means that there were no open spaces which should have been caught earlier, or
  // that the game has evaluated to a win for the computer but we cannot find a "winning" move which
  // should be mathematically impossible
  console.log("Monoid Error: This should not be possible.");
}

/**
 * isDead(board) - returns "true" if the board is dead, i.e., X has won by a three-in-a-row horizontally,
 * vertically or diagonally
 * 
 * @param {string} board
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
    [2, 4, 6]
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
 * isStart(boards) - returns true if all the boards ar ein their initial state (i.e., empty)
 * 
 * @param {Array<string>} boards
 * 
 * @returns {boolean}
 */
export function isStart(boards) {
  return boards.every((b) =>b === "---------");
}

/**
 * isGameOver(boards) - returns true if every board is dead
 * 
 * @param {Array<string>} boards
 * 
 * @returns {boolean}
 */
export function isGameOver(boards) {
  return boards.every((b) =>isDead(b));
}

/**
 * humanMove(boards, idx, squareNum) - make a move on a specific board at a specific square and return the boards
 * with the indicated square marked
 * 
 * However, if the attempted move is illegale because the square is already occupied or the board is dead, return null
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
  return mkMove(boards, idx, squareNum);
}

/**
 * mkMove(boards, idx, squareNum) - create new copy of the board position with this new value
 * added
 * 
 * This is a pure function, returning a modified copy
 * 
 * @param {Array<string>} boards 
 * @param {number} idx 
 * @param {number} squareNum 
 * 
 * @returns {Array<string>}
 */
function mkMove(boards, idx, squareNum) {
  return boards.map((b, i) => i === idx ?
    b.substring(0, squareNum).toUpperCase() + "x" + b.substring(squareNum + 1).toUpperCase() : b.toUpperCase());
}
