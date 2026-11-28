import { useEffect } from 'react';
import { syncBadges } from './badges';

/** Note badges already earned when a page opens, so only new ones are announced later. */
export function useBadgeBaseline() {
  useEffect(() => {
    syncBadges();
  }, []);
}
