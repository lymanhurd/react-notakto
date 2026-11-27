import { useEffect, useRef } from 'react';

/**
 * When a game ends, move keyboard focus to the "Play again" button if focus was lost
 * (the piece just clicked was removed or disabled) or was still on the board.
 * Returns the ref to put on that button.
 */
export function usePlayAgainFocus(phase: string) {
  const ref = useRef<HTMLButtonElement>(null);
  const previous = useRef(phase);
  useEffect(() => {
    if (phase === 'over' && previous.current !== 'over') {
      const active = document.activeElement as HTMLElement | null;
      const lost = !active || active === document.body || (active as HTMLButtonElement).disabled;
      if (lost || active?.closest('.play-board, .game-board, [data-board]')) ref.current?.focus();
    }
    previous.current = phase;
  }, [phase]);
  return ref;
}
