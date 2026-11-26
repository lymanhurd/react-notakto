import { useState } from 'react';
import { decline, forgetName, getName, hasDeclined, MAX_NAME, setName, totalWins } from '../shared/player';

type Mode = 'ask' | 'welcome' | 'hidden';

/**
 * Asks a first-time visitor what to call them (optional), and welcomes them back by
 * name on later visits. The name is stored only in this browser.
 */
export default function Welcome() {
  const [name, setNameState] = useState(getName);
  const [mode, setMode] = useState<Mode>(() => (getName() ? 'welcome' : hasDeclined() ? 'hidden' : 'ask'));
  // True right after saving, so we say "nice to meet you" rather than "welcome back".
  const [justMet, setJustMet] = useState(false);
  const [draft, setDraft] = useState('');
  const [wins] = useState(totalWins);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const saved = setName(draft);
    if (!saved) return;
    setNameState(saved);
    setJustMet(true);
    setMode('welcome');
  }

  if (mode === 'hidden') return null;

  if (mode === 'ask') {
    return (
      <section className="welcome" aria-label="Welcome">
        <form className="welcome-form" onSubmit={save}>
          <label htmlFor="welcome-name">What should we call you?</label>
          <input
            id="welcome-name"
            type="text"
            autoComplete="given-name"
            maxLength={MAX_NAME}
            placeholder="First name or nickname"
            value={draft}
            onChange={e => setDraft(e.target.value)}
          />
          <button type="submit" className="btn-theme primary" disabled={!draft.trim()}
            data-umami-event="welcome-name-saved">
            Save
          </button>
          <button type="button" className="welcome-link" onClick={() => {
            decline();
            setMode('hidden');
          }} data-umami-event="welcome-name-declined">
            No thanks
          </button>
        </form>
        <p className="welcome-note">Optional. Your name stays on this device and is never sent anywhere.</p>
      </section>
    );
  }

  return (
    <section className="welcome" aria-label="Welcome">
      <p className="welcome-greeting">
        {justMet ? <>Nice to meet you, <strong>{name}</strong>!</> : <>Welcome back, <strong>{name}</strong>!</>}
        {!justMet && wins > 0 && (
          <> You've beaten the computer {wins === 1 ? 'once' : `${wins} times`} so far.</>
        )}
      </p>
      <button type="button" className="welcome-link" onClick={() => {
        forgetName();
        setNameState(null);
        setJustMet(false);
        setDraft('');
        setMode('ask');
      }}>
        Not {name}?
      </button>
    </section>
  );
}
