import { useState } from 'react';
import { clearEverything } from '../shared/player';
import { CONTACT_EMAIL, contactClickAttrs } from '../shared/links';

const UPDATED = 'November 26, 2026';

export default function Privacy() {
  const [cleared, setCleared] = useState(false);

  return (
    <main className="privacy">
      <h1>Privacy</h1>
      <p className="privacy-updated">Last updated {UPDATED}</p>

      <section className="privacy-summary" aria-label="Summary">
        <h2>The short version</h2>
        <ul>
          <li><strong>No cookies.</strong> This site doesn't set any.</li>
          <li><strong>No accounts, no ads, no tracking across other sites.</strong></li>
          <li><strong>Your name and scores never leave your browser.</strong> They're saved on your device only.</li>
          <li>We count visits <strong>anonymously</strong> so we know which games people play.</li>
        </ul>
      </section>

      <section className="rules-card">
        <h2>What stays on your device</h2>
        <p>
          If you tell the front page your name, and as you play, your browser saves a few things in its own
          storage on your device: your name (if you gave one), your win/loss record, your settings for each game,
          your Daily Challenge streak, and an unfinished NoTakTo game. This is how the site welcomes you back and remembers your score.
        </p>
        <p>
          None of it is sent to us or anyone else. Someone using a different computer or browser won't see it,
          and you can remove it at any time:
        </p>
        <p>
          <button type="button" className="btn-theme" disabled={cleared} onClick={() => {
            clearEverything();
            setCleared(true);
          }}>
            {cleared ? 'Cleared' : 'Clear my name and scores on this device'}
          </button>
        </p>
        {cleared && <p role="status">Done. Your name, scores and settings have been removed from this browser.</p>}
      </section>

      <section className="rules-card">
        <h2>Anonymous visit counts</h2>
        <p>
          We use <a href="https://umami.is/" target="_blank" rel="noopener">Umami</a>, a privacy-focused analytics
          service, to count visits. It uses no cookies and doesn't store your IP address. It records things like
          which page was visited, the website that linked here, the type of browser and device, and the country.
          We also count a few actions, such as a game being started or finished (and who won), and clicks on links
          to the worksheet store.
        </p>
        <p>
          These counts can't identify you, and they never include your name or anything you type. If your browser
          is set to "Do Not Track," Umami doesn't count you at all.
        </p>
      </section>

      <section className="rules-card">
        <h2>Other services your browser contacts</h2>
        <ul className="rules">
          <li>
            <strong>Hosting.</strong> The site is hosted by Hostinger. Like almost every web server, theirs may keep
            standard logs (such as IP address and the page requested) for security and reliability.
          </li>
          <li>
            <strong>Videos.</strong> The NoTakTo discussion page embeds YouTube videos in YouTube's
            privacy-enhanced mode. YouTube may set its own cookies if you play a video.
          </li>
          <li>
            <strong>Links to other sites.</strong> The worksheet store on <em>Teachers Pay Teachers</em> and other
            linked sites have their own privacy policies.
          </li>
        </ul>
      </section>

      <section className="rules-card">
        <h2>Children</h2>
        <p>
          These games are made for students. We don't collect personal information from anyone, children
          included: there are no accounts, and a name typed on the front page stays on that device.
        </p>
      </section>

      <section className="rules-card">
        <h2>Questions</h2>
        <p>
          Email <a href={`mailto:${CONTACT_EMAIL}`} {...contactClickAttrs('privacy')}>{CONTACT_EMAIL}</a>. If this
          page changes, the date at the top will change too.
        </p>
      </section>
    </main>
  );
}
