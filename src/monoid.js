/**
 * The logic in this module is taken from the paper: "The Secrets of Notakto: Winning at X-only
 * Tic-Tac-Toe" (https://arxiv.org/pdf/1301.1672v1.pdf) by Thane E. Plambeck, Greg Whitehead
 * January 9, 2013
 */

/**
 * isWinning(boards) - determine if the current position is a win for the player assuming that
 * it is the opponent's turn to play
 * 
 * In other words, if at the start of your turn isWinning(boards) is true, you have lost and
 * with perfect play cannot win
 * 
 * The computer strives to leave the board in an isWinning state at the ene od its turn
 * 
 * @param {Array<string}} boards
 * 
 * @returns {boolean} 
 */
export function isWinning(boards) {
    const coeffs = boards.map(b => BOARD_VALUES[b.toUpperCase()] || 0);
    return winningIndices.includes(findMonoidProduct(coeffs));
}

/**
 * findMonoidProduct(coeffs) - multiply the board values for each of the constituent boards using the Monoid
 * multiplication rules
 * 
 * @param {Array<number>} board
 * 
 * @returns {boolean}
 */
function findMonoidProduct(coeffs) {
    return coeffs.reduce(
        (accumulator, currentValue) => multiply(accumulator , currentValue));
}

/**
 * multiply(m1, m2) - Multiply two Mondoid coefficients using the fact that the operation is commutative
 * 
 * @param {number}} m1 
 * @param {number} m2
 * 
 * @returns {number}
 */
function multiply(m1, m2) {
    return MULTIPLICATION_TABLE[
        Math.min(m1, m2) + '*' + Math.max(m1, m2)];
}

/**
 * Defines the monoid value for a given board position
 * Any board position not represented has a value of "0"
 * (the 0 index correpsonds to the multiplative identity, 1)
 */
const BOARD_VALUES = {
    '---------': 6,
    '-------XX': 15,
    '------X-X': 2,
    '------XX-': 15,
    '-----X--X': 15,
    '-----X-X-': 1,
    '-----X-XX': 2,
    '-----XX--': 2,
    '-----XX-X': 1,
    '-----XXX-': 14,
    '----X----': 10,
    '----X---X': 2,
    '----X--X-': 2,
    '----X--XX': 3,
    '----X-X--': 2,
    '----X-X-X': 1,
    '----X-XX-': 3,
    '----XX---': 2,
    '----XX--X': 3,
    '----XX-X-': 3,
    '----XX-XX': 1,
    '----XXX--': 1,
    '----XXX-X': 2,
    '----XXXX-': 2,
    '---X----X': 2,
    '---X---X-': 1,
    '---X---XX': 14,
    '---X--X--': 15,
    '---X--X-X': 1,
    '---X--XX-': 2,
    '---X-X---': 1,
    '---X-X--X': 14,
    '---X-X-X-': 2,
    '---X-X-XX': 1,
    '---X-XX--': 14,
    '---X-XX-X': 2,
    '---X-XXX-': 1,
    '---XX----': 2,
    '---XX---X': 1,
    '---XX--X-': 3,
    '---XX--XX': 2,
    '---XX-X--': 3,
    '---XX-X-X': 2,
    '---XX-XX-': 1,
    '--X-----X': 2,
    '--X----X-': 2,
    '--X----XX': 1,
    ' ----X-X-': 1,
    '--X---X--': 1,
    '--X---X-X': 3,
    '--X---XX-': 14,
    '--X--X---': 15,
    '--X--X-X-': 14,
    '--X--XX--': 14,
    '--X--XXX-': 3,
    '--X-X----': 2,
    '--X-X---X': 1,
    '--X-X--X-': 1,
    '--X-X--XX': 2,
    '--X-XX---': 3,
    '--X-XX-X-': 2,
    '--XX-----': 2,
    '--XX----X': 1,
    '--XX---XX': 2,
    '--XX--X--': 14,
    '--XX--X-X': 2,
    '--XX--XX-': 1,
    '--XX-X---': 14,
    '--XX-X-X-': 3,
    '--XX-XX--': 1,
    '--XX-XXX-': 2,
    '--XXX----': 1,
    '--XXX---X': 2,
    '--XXX--X-': 2,
    '--XXX--XX': 1,
    '-X------X': 2,
    '-X-----X-': 1,
    '-X-----XX': 14,
    '-X----X--': 2,
    '-X----X-X': 1,
    '-X----XX-': 14,
    '-X---X---': 1,
    '-X---X--X': 14,
    '-X---X-X-': 2,
    '-X---X-XX': 1,
    '-X---XX-X': 2,
    '-X---XXX-': 3,
    '-X--X----': 2,
    '-X--X---X': 1,
    '-X--X-X--': 1,
    '-X--X-X-X': 2,
    '-X--XX---': 3,
    '-X--XX--X': 2,
    '-X--XXX--': 2,
    '-X--XXX-X': 1,
    '-X-X-----': 1,
    '-X-X---X-': 2,
    '-X-X---XX': 3,
    '-X-X--X--': 14,
    '-X-X--X-X': 2,
    '-X-X--XX-': 1,
    '-X-X-X---': 2,
    '-X-X-X--X': 3,
    '-X-X-X-X-': 1,
    '-X-X-X-XX': 2,
    '-X-X-XX--': 3,
    '-X-X-XX-X': 1,
    '-X-X-XXX-': 2,
    '-X-XX----': 3,
    '-X-XX---X': 2,
    '-X-XX-X--': 2,
    '-X-XX-X-X': 1,
    '-XX------': 15,
    '-XX-----X': 1,
    '-XX----X-': 14,
    '-XX----XX': 2,
    '-XX---X--': 14,
    '-XX---X-X': 2,
    '-XX---XX-': 1,
    '-XX--X---': 2,
    '-XX--X-X-': 1,
    '-XX--XX--': 1,
    '-XX--XXX-': 2,
    '-XX-X----': 3,
    '-XX-X---X': 2,
    '-XX-XX---': 1,
    '-XXX-----': 14,
    '-XXX----X': 2,
    '-XXX---X-': 3,
    '-XXX---XX': 1,
    '-XXX--X--': 3,
    '-XXX--X-X': 1,
    '-XXX--XX-': 2,
    '-XXX-X---': 1,
    '-XXX-X-X-': 2,
    '-XXX-XX--': 2,
    '-XXX-XXX-': 1,
    '-XXXX----': 2,
    '-XXXX---X': 1,
    'X-------X': 1,
    'X------X-': 2,
    'X------XX': 14,
    'X-----X--': 2,
    'X-----X-X': 3,
    'X-----XX-': 1,
    'X----X---': 2,
    'X----X--X': 14,
    'X----X-XX': 1,
    'X----XX--': 1,
    'X----XX-X': 2,
    'X----XXX-': 2,
    'X---X----': 2,
    'X---X--X-': 1,
    'X---X-X--': 1,
    'X---X-XX-': 2,
    'X---XX---': 1,
    'X---XX-X-': 2,
    'X---XXX--': 2,
    'X---XXXX-': 1,
    'X--X-----': 15,
    'X--X----X': 14,
    'X--X---X-': 14,
    'X--X---XX': 3,
    'X--X-X---': 14,
    'X--X-X--X': 1,
    'X--X-X-X-': 3,
    'X--X-X-XX': 2,
    'X--XX----': 3,
    'X--XX--X-': 2,
    'X-X------': 2,
    'X-X-----X': 3,
    'X-X----X-': 1,
    'X-X----XX': 2,
    'X-X---X--': 3,
    'X-X---X-X': 1,
    'X-X---XX-': 2,
    'X-X--X---': 1,
    'X-X--X-X-': 2,
    'X-X--XX--': 2,
    'X-X--XXX-': 1,
    'X-X-X----': 1,
    'X-X-X--X-': 2,
    'X-X-XX---': 2,
    'X-X-XX-X-': 1,
    'X-XX-----': 1,
    'X-XX----X': 2,
    'X-XX---X-': 2,
    'X-XX---XX': 1,
    'X-XX-X---': 2,
    'X-XX-X-X-': 1,
    'X-XXX----': 2,
    'X-XXX--X-': 1,
    'XX-------': 15,
    'XX------X': 14,
    'XX-----X-': 14,
    'XX-----XX': 1,
    'XX----X--': 1,
    'XX----X-X': 2,
    'XX----XX-': 2,
    'XX---X---': 14,
    'XX---X--X': 3,
    'XX---X-X-': 3,
    'XX---X-XX': 2,
    'XX---XX--': 2,
    'XX---XX-X': 1,
    'XX---XXX-': 1,
    'XX--X----': 3,
    'XX--X-X--': 2,
    'XX--XX---': 2,
    'XX--XXX--': 1,
    'XX-X-----': 2,
    'XX-X----X': 1,
    'XX-X---X-': 1,
    'XX-X---XX': 2,
    'XX-X-X---': 1,
    'XX-X-X--X': 2,
    'XX-X-X-X-': 2,
    'XX-X-X-XX': 1,
    'XX-XX----': 1};

/**
 * A player has a winning position if at the end of their turn the product of the board
 * positions is in this set
 */
export const winningIndices = [1, 4, 8, 10];

/**
 * The rules of multiplication for the Monoid
 * There are 18 distinct elements (hence 18 * 18 possible products)
 * but the rule is commutative, so we only need to consider a*b where a <= b/
 */
export const MULTIPLICATION_TABLE = {
    '0*0': 0, '0*1': 1, '0*2': 2, '0*3': 3, '0*4': 4,
    '0*5': 5, '0*6': 6, '0*7': 7, '0*8': 8, '0*9': 9,
    '0*10': 10, '0*11': 11, '0*12': 12, '0*13': 13,
    '0*14': 14, '0*15': 15, '0*16': 16, '0*17': 17,
    '1*1': 0, '1*2': 3, '1*3': 2, '1*4': 5, '1*5': 4,
    '1*6': 7, '1*7': 6, '1*8': 9, '1*9': 8, '1*10': 11,
    '1*11': 10, '1*12': 13, '1*13': 12, '1*14': 15,
    '1*15': 14, '1*16': 17, '1*17': 16,
    '2*2': 4, '2*3': 5, '2*4': 2, '2*5': 3, '2*6': 8, '2*7': 9,
    '2*8': 6, '2*9': 7, '2*10': 12, '2*11': 13,'2*12': 10,
    '2*13': 11, '2*14': 16, '2*15': 17, '2*16': 14, '2*17': 15,
    '3*3': 4, '3*4': 3, '3*5': 2, '3*6': 9, '3*7': 8, '3*8': 7,
    '3*9': 6, '3*10': 13, '3*11': 12, '3*12': 11, '3*13': 10,
    '3*14': 17, '3*15': 16, '3*16': 15, '3*17': 14,
    '4*4': 4, '4*5': 5, '4*6': 6, '4*7': 7,
    '4*8': 8, '4*9': 9, '4*10': 10, '4*11': 11, '4*12': 12,
    '4*13': 13, '4*14': 14, '4*15': 15, '4*16': 16, '4*17': 17,
    '5*5': 4, '5*6': 7, '5*7': 6, '5*8': 9, '5*9': 8,
    '5*10': 11, '5*11': 10, '5*12': 13, '5*13': 12, '5*14': 15,
    '5*15': 14, '5*16': 17, '5*17': 16,
    '6*6': 10, '6*7': 11, '6*8': 12, '6*9': 13, '6*10': 11,
    '6*11': 10, '6*12': 13, '6*13': 12, '6*14': 15, '6*15': 14,
    '6*16': 17, '6*17': 16,
    '7*7': 10, '7*8': 13, '7*9': 12, '7*10': 10, '7*11': 11,
    '7*12': 12, '7*13': 13, '7*14': 14, '7*15': 15,
    '7*16': 16, '7*17': 17,
    '8*8': 10, '8*9': 11, '8*10': 13, '8*11': 12, '8*12': 11,
    '8*13': 10, '8*14': 17, '8*15': 16, '8*16': 15, '8*17': 14,
    '9*9': 10, '9*10': 12, '9*11': 13, '9*12': 10, '9*13': 11,
    '9*14': 16, '9*15': 17, '9*16': 14, '9*17': 15,
    '10*10': 10, '10*11': 11, '10*12': 12, '10*13': 13,
    '10*14': 14, '10*15': 15, '10*16': 16, '10*17': 17,
    '11*11': 10, '11*12': 13, '11*13': 12, '11*14': 15,
    '11*15': 14, '11*16': 17, '11*17': 16,
    '12*12': 10, '12*13': 11, '12*14': 16, '12*15': 17,
    '12*16': 14, '12*17': 15,
    '13*13': 10, '13*14': 17, '13*15': 16, '13*16': 15,
    '13*17': 14,
    '14*14': 10, '14*15': 11, '14*16': 12, '14*17': 13,
    '15*15': 10, '15*16': 13, '15*17': 12,
    '16*16': 10, '16*17': 11,
    '17*17': 10};

// For future expansion (the \xB2 signifies "squared") these are the official names of the 18 Monoid elements
//    const MONOID_NAMES = ['1', 'a', 'b', 'ab', 'b\xB2', 'ab\xB2', 'c', 'ac', 'bc', 'abc', 'c\xB2', 'ac\xB2', 'bc\xB2', 'abc\xB2', 'd', 'ad', 'bd', 'abd']
