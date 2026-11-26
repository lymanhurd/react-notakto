import { useEffect, useRef, useState } from 'react';
import { load, save } from './storage';
import { trackGameEnd, trackGameStart } from './analytics';
import type { Player, Stats } from './GameParts';
import { useHelpTracker } from './help';

export type Phase = 'setup' | 'playing' | 'over';

interface Options<S, M> {
  initial: S;
  apply: (state: S, move: M) => S;
  /** True when the player to move has no legal move (normal play: they lose). */
  isOver: (state: S) => boolean;
  computerMove: (state: S) => M | null;
  /** localStorage key for the running score. */
  statsKey: string;
  /** Game name for analytics, e.g. "grundy". */
  game: string;
  /** Short description of a starting position for analytics, e.g. "8 dots". */
  describeStart: (state: S) => string;
  /** True while a helper view (clusters, tally, values, marked squares, …) is switched on. */
  helpersOn?: boolean;
  delayMs?: number;
}

/**
 * Turn flow shared by the human-vs-computer strategy games:
 * the human moves, the computer's move is shown as `pending` for a moment,
 * then played; whoever makes the last move wins.
 */
export function useTurnGame<S, M>({
  initial, apply, isOver, computerMove, statsKey, game, describeStart, helpersOn = false, delayMs = 900,
}: Options<S, M>) {
  const [state, setState] = useState<S>(initial);
  const [phase, setPhase] = useState<Phase>('setup');
  const [turn, setTurn] = useState<Player>('human');
  const [winner, setWinner] = useState<Player | null>(null);
  const [pending, setPending] = useState<M | null>(null);
  const [lastComputerMove, setLastComputerMove] = useState<M | null>(null);
  const [stats, setStats] = useState<Stats>(() => load(statsKey, { humanWins: 0, computerWins: 0 }));
  // Whether the game just finished was won with help (Hint or a helper view).
  const [helpedWin, setHelpedWin] = useState(false);
  const help = useHelpTracker(helpersOn, phase);

  // The latest state, for the computer's delayed move.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => save(statsKey, stats), [statsKey, stats]);

  function play(who: Player, move: M) {
    // The human's first move from the setup screen starts the game.
    if (who === 'human' && phase === 'setup') trackGameStart(game, 'human', describeStart(stateRef.current));
    const next = apply(stateRef.current, move);
    stateRef.current = next;
    setState(next);
    if (isOver(next)) {
      const helped = help.helped(helpersOn);
      setPhase('over');
      setWinner(who);
      setHelpedWin(who === 'human' && helped);
      trackGameEnd(game, who);
      setStats(s => (who === 'human'
        ? { ...s, humanWins: s.humanWins + 1, cleanWins: (s.cleanWins ?? 0) + (helped ? 0 : 1) }
        : { ...s, computerWins: s.computerWins + 1 }));
    } else {
      setPhase('playing');
      if (who === 'human') {
        setTurn('computer');
        setPending(computerMove(next));
      } else {
        setTurn('human');
      }
    }
  }

  useEffect(() => {
    if (pending === null) return;
    const move = pending;
    const timer = window.setTimeout(() => {
      setPending(null);
      setLastComputerMove(move);
      play('computer', move);
    }, delayMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per computer move
  }, [pending]);

  const humanToMove = phase !== 'over' && turn === 'human' && pending === null;

  return {
    state,
    phase,
    winner,
    pending,
    lastComputerMove,
    stats,
    humanToMove,
    /** The game just won used Hint or a helper view. */
    helpedWin,
    /** Call when the player presses Hint. */
    markHint: help.markHint,
    playHuman(move: M) {
      if (humanToMove) play('human', move);
    },
    computerFirst() {
      trackGameStart(game, 'computer', describeStart(stateRef.current));
      setPhase('playing');
      setTurn('computer');
      setPending(computerMove(stateRef.current));
    },
    /** Start over from a new setup position. */
    reset(next: S) {
      stateRef.current = next;
      setState(next);
      setPhase('setup');
      setTurn('human');
      setWinner(null);
      setPending(null);
      setLastComputerMove(null);
      setHelpedWin(false);
      help.reset(helpersOn);
    },
  };
}
