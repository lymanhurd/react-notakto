import { useLayoutEffect, useRef } from 'react';

/**
 * Keyboard navigation shared by every game board (the "roving tabindex" pattern).
 *
 * The board is one stop in the Tab order. Inside it, the arrow keys move between
 * pieces, Home/End jump to the ends of a row, and Enter/Space play the piece as
 * usual. A piece takes part when it carries `data-row` and `data-col`
 * (numbers: the row it sits in and its position along that row).
 *
 * The hook also keeps focus on the board when the piece in focus disappears
 * (a stone taken, a square eaten): focus moves to the nearest piece left.
 * `onDescribe` runs when D is pressed inside the board.
 *
 * Call it in the game component, so it runs after every render; put the
 * returned ref on the element that holds the pieces.
 */
export function useBoardNav<T extends HTMLElement = HTMLDivElement>(onDescribe?: () => void) {
  const ref = useRef<T>(null);
  // Where focus was last on this board, to restore it when that piece goes away.
  const last = useRef<{ row: number; col: number; active: boolean }>({ row: 0, col: 0, active: false });
  const describe = useRef(onDescribe);

  // The board element the listeners are on, and how to take them off again.
  const attached = useRef<{ el: HTMLElement; detach: () => void } | null>(null);

  useLayoutEffect(() => {
    describe.current = onDescribe;
    const board = ref.current;
    // The board can appear, disappear or be replaced (e.g. switching views).
    if (attached.current?.el !== board) {
      attached.current?.detach();
      attached.current = board ? { el: board, detach: listen(board, last, describe) } : null;
    }
    if (!board) return;
    const pieces = items(board);
    if (pieces.length === 0) {
      // The board emptied (game over): there is nothing to keep focus on, so a
      // later new board must not pull focus back from wherever it went.
      last.current.active = false;
      return;
    }

    // Focus was on a piece that is gone: move it to the nearest one.
    const focus = document.activeElement;
    const lost = !focus || focus === document.body || !document.contains(focus);
    if (last.current.active && lost) {
      const target = nearest(pieces, last.current.row, last.current.col);
      setTabStop(pieces, target);
      target.focus();
      return;
    }
    // Exactly one piece is in the Tab order: keep the current one if it's still here.
    const current = pieces.find(p => p.tabIndex === 0 && p.dataset.tabstop === 'true');
    setTabStop(pieces, current ?? nearest(pieces, last.current.row, last.current.col));
  });

  useLayoutEffect(() => () => {
    attached.current?.detach();
    attached.current = null;
  }, []);

  return ref;
}

type Last = { current: { row: number; col: number; active: boolean } };

function listen(board: HTMLElement, last: Last, describe: { current?: () => void }): () => void {
  const onFocusIn = (e: FocusEvent) => {
    const piece = (e.target as HTMLElement).closest<HTMLElement>('[data-row]');
    if (!piece || !board.contains(piece)) return;
    last.current = { ...coords(piece), active: true };
    setTabStop(items(board), piece);
  };
  const onFocusOut = (e: FocusEvent) => {
    // Leaving the board for another element (not losing focus to a removed piece).
    const next = e.relatedTarget as Node | null;
    if (next && !board.contains(next)) last.current.active = false;
  };
  // Focus arriving anywhere else on the page (e.g. moved to "Play again" after the
  // focused stone was taken, when no focusout fires) also means it left the board.
  const onDocFocusIn = (e: FocusEvent) => {
    if (e.target instanceof Node && !board.contains(e.target)) last.current.active = false;
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.altKey || e.metaKey) return;
    if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && describe.current) {
      e.preventDefault();
      describe.current();
      return;
    }
    const piece = (e.target as HTMLElement).closest<HTMLElement>('[data-row]');
    if (!piece) return;
    const target = step(items(board), piece, e.key, e.ctrlKey);
    if (!target) return;
    e.preventDefault();
    setTabStop(items(board), target);
    target.focus();
  };
  board.addEventListener('focusin', onFocusIn);
  board.addEventListener('focusout', onFocusOut);
  board.addEventListener('keydown', onKeyDown);
  document.addEventListener('focusin', onDocFocusIn);
  return () => {
    document.removeEventListener('focusin', onDocFocusIn);
    board.removeEventListener('focusin', onFocusIn);
    board.removeEventListener('focusout', onFocusOut);
    board.removeEventListener('keydown', onKeyDown);
  };
}

function items(board: HTMLElement): HTMLElement[] {
  return [...board.querySelectorAll<HTMLElement>('[data-row][data-col]')];
}

function coords(el: HTMLElement) {
  return { row: Number(el.dataset.row), col: Number(el.dataset.col) };
}

function setTabStop(pieces: HTMLElement[], stop: HTMLElement) {
  for (const p of pieces) {
    p.tabIndex = p === stop ? 0 : -1;
    p.dataset.tabstop = p === stop ? 'true' : 'false';
  }
}

/** The piece closest to (row, col): same row first, then the nearest row. */
function nearest(pieces: HTMLElement[], row: number, col: number): HTMLElement {
  let best = pieces[0];
  let bestScore = Infinity;
  for (const p of pieces) {
    const c = coords(p);
    const score = Math.abs(c.row - row) * 1000 + Math.abs(c.col - col);
    if (score < bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

function step(pieces: HTMLElement[], from: HTMLElement, key: string, ctrl: boolean): HTMLElement | null {
  const { row, col } = coords(from);
  const rowOf = (r: number) => pieces.filter(p => coords(p).row === r).sort((a, b) => coords(a).col - coords(b).col);
  const rows = [...new Set(pieces.map(p => coords(p).row))].sort((a, b) => a - b);
  const same = rowOf(row);
  const i = same.indexOf(from);
  switch (key) {
    case 'ArrowRight': return same[i + 1] ?? null;
    case 'ArrowLeft': return i > 0 ? same[i - 1] : null;
    case 'Home': return ctrl ? rowOf(rows[0])[0] : same[0];
    case 'End': {
      if (!ctrl) return same[same.length - 1];
      const lastRow = rowOf(rows[rows.length - 1]);
      return lastRow[lastRow.length - 1];
    }
    case 'ArrowDown':
    case 'ArrowUp': {
      const r = rows[rows.indexOf(row) + (key === 'ArrowDown' ? 1 : -1)];
      if (r === undefined) return null;
      return nearest(rowOf(r), r, col);
    }
    default: return null;
  }
}
