import { useCallback, useState } from 'react';

const NBSP = String.fromCharCode(160);

/**
 * The words a screen reader speaks when the player asks to hear the board
 * (the "Describe board" button, or D on the board). Each request alternates a
 * trailing space so the same text is announced again.
 */
export function useBoardDescription(text: string) {
  const [spoken, setSpoken] = useState('');
  const describe = useCallback(() => {
    setSpoken(prev => (prev === text ? text + NBSP : text));
  }, [text]);
  return { describe, spoken };
}
