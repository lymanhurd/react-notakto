import { useState } from 'react';
import { currentStreak, DAILY_KEY, dateKey, dayResult, EMPTY_RECORD, KIND_INFO, puzzleFor } from '../daily/logic';
import { load } from '../shared/storage';

/** Front-page panel inviting the player to today's Daily Challenge, with their streak. */
export default function DailyTeaser() {
  const [state] = useState(() => {
    const today = dateKey();
    const record = load(DAILY_KEY, EMPTY_RECORD);
    return { puzzle: puzzleFor(today), day: dayResult(record, today), streak: currentStreak(record, today) };
  });
  const { puzzle, day, streak } = state;

  let status: string;
  if (day.solved) status = `Solved today. ${streak > 1 ? `${streak}-day streak!` : 'Come back tomorrow to build a streak.'}`;
  else if (day.revealed) status = 'Answer seen today. A new puzzle arrives tomorrow.';
  else if (streak > 0) status = `${streak}-day streak. Solve today's puzzle to keep it going!`;
  else status = 'One puzzle a day: find the winning move, and start a streak.';

  return (
    <section className={`daily-teaser${day.solved ? ' solved' : ''}`} aria-labelledby="daily-teaser-heading">
      <div>
        <p className="eyebrow">Daily Challenge #{puzzle.number}</p>
        <h2 id="daily-teaser-heading">Today: {KIND_INFO[puzzle.kind].title}</h2>
        <p>{status}</p>
      </div>
      <a className="store-button daily-teaser-button" href="/daily/" data-umami-event="daily-teaser-click">
        {day.solved || day.revealed ? 'See today’s puzzle' : 'Play today’s puzzle'} <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
