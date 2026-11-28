/**
 * Did focus on `el` come from the keyboard? Boards preview a move when a piece
 * is pointed at or focused, but focus also lands on pieces after a click (and
 * when the board puts focus back after the focused piece is taken). Previewing
 * then would grey out pieces the player never pointed at, so only keyboard
 * focus (the kind that shows a focus ring) previews.
 */
export function keyboardFocus(el: Element): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true; // Browsers without :focus-visible: keep the old behaviour.
  }
}
