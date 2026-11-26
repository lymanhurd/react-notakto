import { useEffect, useRef } from 'react';

/**
 * Tracks whether the player had help during the current game, so the progress page
 * can count "wins without help". Help means pressing Hint, or having a helper view
 * switched on (Nim's clusters and tally, Wythoff's marked squares, value tables, …)
 * at any point from the first move to the end of the game.
 *
 * Before the first move only the current setting counts, so a player can switch the
 * helpers off during setup and still earn a win without help.
 */
export function useHelpTracker(helpersOn: boolean, phase: 'setup' | 'playing' | 'over') {
  const hinted = useRef(false);
  const helpersSeen = useRef(helpersOn);

  useEffect(() => {
    if (phase === 'setup') helpersSeen.current = helpersOn;
    else if (phase === 'playing' && helpersOn) helpersSeen.current = true;
  }, [helpersOn, phase]);

  return {
    /** Call when the player presses Hint. */
    markHint() {
      hinted.current = true;
    },
    /** Did the player have help in this game? `helpersNow` is the current helper setting. */
    helped(helpersNow: boolean) {
      return hinted.current || helpersSeen.current || helpersNow;
    },
    /** Start tracking a new game. */
    reset(helpersNow: boolean) {
      hinted.current = false;
      helpersSeen.current = helpersNow;
    },
  };
}
