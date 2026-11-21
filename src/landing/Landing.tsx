import '../shared/theme.css';
import './landing.css';
import { games } from './games';
import SiteFooter from '../shared/SiteFooter';
import { CONTACT_EMAIL, STORE_URL, contactClickAttrs, storeClickAttrs } from '../shared/links';

const Landing = () => (
  <>
    <header className="brand-band">
      <div className="brand-inner">
        <nav className="brand-nav" aria-label="Site">
          <a href="#games">Games</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href={STORE_URL} target="_blank" rel="noopener" {...storeClickAttrs('home-nav')}>
            Store <span aria-hidden="true">↗</span>
            <span className="visually-hidden"> (opens Teachers Pay Teachers in a new tab)</span>
          </a>
        </nav>
        <div className="brand-hero">
          <img className="brand-badge" src="/images/logo-badge.webp" alt="" width="240" height="238" />
          <div className="brand-text">
            <h1>Lyman's Logic Games</h1>
            <p className="brand-sub">Math Enrichment, Game Theory &amp; Logic Puzzles</p>
            <p className="brand-tagline">Fun, visual, and playable resources for Grades 5–10.</p>
            <p className="brand-store">
              Teaching with these games?{' '}
              <a href={STORE_URL} target="_blank" rel="noopener" {...storeClickAttrs('home-header')}>
                Get the classroom worksheets
              </a>
            </p>
          </div>
        </div>
      </div>
    </header>

    <div className="page landing">
      <main>
        <section id="games" aria-labelledby="games-heading">
          <p className="eyebrow">Play free, right in your browser</p>
          <h2 id="games-heading" className="section-heading">The games</h2>
          <ul className="game-list">
            {games.map(game => (
              <li key={game.href}>
                <a className="game-card" href={game.href}>
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                  {game.tags && game.tags.length > 0 && (
                    <ul className="tags">
                      {game.tags.map(tag => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  )}
                  <span className="play">
                    Play <span aria-hidden="true">→</span>
                  </span>
                </a>
              </li>
            ))}
            <li>
              <div className="game-card coming-soon">
                <h3>More coming soon</h3>
                <p>New games will appear here as they're added.</p>
              </div>
            </li>
          </ul>
        </section>

        <section className="store-callout" aria-labelledby="store-heading">
          <div>
            <p className="eyebrow">For teachers</p>
            <h2 id="store-heading">Classroom worksheets</h2>
            <p>
              Strategy packets and worksheets that go with these games, with warm-up puzzles, practice boards and
              answer keys, are available in the Lyman's Logic Games store on <em>Teachers Pay Teachers</em>.
            </p>
          </div>
          <a className="store-button" href={STORE_URL} target="_blank" rel="noopener" {...storeClickAttrs('home-panel')}>
            Visit the store <span aria-hidden="true">↗</span>
            <span className="visually-hidden"> (opens Teachers Pay Teachers in a new tab)</span>
          </a>
        </section>

        <section id="about" className="about" aria-labelledby="about-heading">
          <p className="eyebrow">About</p>
          <h2 id="about-heading" className="section-heading">Hi, I'm Lyman Hurd</h2>
          <div className="about-grid">
            <div className="about-body">
              <p>
                I'm a mathematician, software architect and longtime enrichment educator who loves turning deep
                mathematical ideas into playable games and visual puzzles. I've taught hands-on workshops to middle
                and high school students through the <a href="https://esp.mit.edu/" target="_blank" rel="noopener"><strong>MIT Educational Studies Program</strong></a> (Splash,
                Spark, Cascade and HSSP) and <strong>Google Tech Day</strong>, and spent three summers mentoring
                high school researchers at the <a href="https://education.wolfram.com/summer-research-high-school/" target="_blank" rel="noopener"><strong>Wolfram Summer Research Program</strong></a>.
              </p>
              <p>
                My teaching philosophy is <strong>“play first, formalize second.”</strong> Whether students are
                exploring Nim, NoTakTo, Kayles, Grundy's Game or Chomp, they start by playing and spotting patterns
                before they meet any heavy notation. The best moment is watching a student go from guessing moves
                to discovering the hidden symmetry behind a game, and realizing they can beat the computer every
                single time.
              </p>
              <p>
                Outside the classroom, I was a postdoctoral researcher in chaotic dynamical systems and cellular
                automata at the University of Maryland, then spent more than three decades as a research scientist
                and software engineer, including nearly nine years at Google/YouTube. I'm the author of{' '}
                <em>Fractal Image Compression</em> and an inventor on five U.S. patents. I live in Concord, New
                Hampshire, and when I'm not designing math games I enjoy aviation.
              </p>
            </div>
            <ul className="about-facts">
              <li><strong>Ph.D. in Mathematics</strong> Princeton University</li>
              <li><strong>B.S. in Mathematics</strong> MIT</li>
              <li><strong>Postdoctoral Fellow</strong> University of Maryland</li>
              <li>
                <strong>Teaching</strong>{' '}
                <a href="https://esp.mit.edu/" target="_blank" rel="noopener">MIT ESP</a> · Google Tech Day ·{' '}
                <a href="https://education.wolfram.com/summer-research-high-school/" target="_blank" rel="noopener">Wolfram Summer Research Program</a>
              </li>
            </ul>
          </div>
        </section>

        <section id="contact" className="contact" aria-labelledby="contact-heading">
          <div>
            <p className="eyebrow">Contact</p>
            <h2 id="contact-heading">Questions, ideas or classroom stories?</h2>
            <p>
              I'd love to hear how you're using these games, and I'm happy to answer questions about the worksheets.
            </p>
          </div>
          <a className="contact-button" href={`mailto:${CONTACT_EMAIL}`} {...contactClickAttrs('home-contact')}>
            {CONTACT_EMAIL}
          </a>
        </section>
      </main>

      <SiteFooter showStore={false} />
    </div>
  </>
);

export default Landing;
