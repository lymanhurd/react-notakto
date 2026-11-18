import { useEffect, useRef, useState } from 'react';
import { load, save } from './storage';
import type { Player, Stats } from './GameParts';

export type Phase = 'setup' | 'playing' | 'over';

interface Options<S, M> {
  initial: S;
  apply: (state: S, move: M) => S;
  /** True when the player to move has no legal move (normal play: they lose). */
  isOver: (state: S) => boolean;
  computerMove: (state: S) => M | null;
  /** sessionStorage key for the running score. */
  statsKey: string;
  delayMs?: number;
}

/**
 * Turn flow shared by the human-vs-computer strategy games:
 * the human moves, the computer's move is shown as `pending` for a moment,
 * then played; whoever makes the last move wins.
 */
export function useTurnGame<S, M>({
  initial, apply, isOver, computerMove, statsKey, delayMs = 900,
}: Options<S, M>) {
  const [state, setState] = useState<S>(initial);
  const [phase, setPhase] = useState<Phase>('setup');
  const [turn, setTurn] = useState<Player>('human');
  const [winner, setWinner] = useState<Player | null>(null);
  const [pending, setPending] = useState<M | null>(null);
  const [lastComputerMove, setLastComputerMove] = useState<M | null>(null);
  const [stats, setStats] = useState<Stats>(() => load(statsKey, { humanWins: 0, computerWins: 0 }));

  // The latest state, for the computer's delayed move.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => save(statsKey, stats), [statsKey, stats]);

  function play(who: Player, move: M) {
    const next = apply(stateRef.current, move);
    stateRef.current = next;
    setState(next);
    if (isOver(next)) {
      setPhase('over');
      setWinner(who);
      setStats(s => (who === 'human'
        ? { ...s, humanWins: s.humanWins + 1 }
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
    playHuman(move: M) {
      if (humanToMove) play('human', move);
    },
    computerFirst() {
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
    },
  };
}
