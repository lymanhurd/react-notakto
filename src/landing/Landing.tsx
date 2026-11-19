import '../shared/theme.css';
import './landing.css';
import { games } from './games';
import SiteFooter from '../shared/SiteFooter';

/** Lyman's Logic Games store on Teachers Pay Teachers (worksheets for the games). */
const STORE_URL = 'https://www.teacherspayteachers.com/store/lymans-logic-games';

const Landing = () => (
  <div className="page landing">
    <header className="landing-header">
      <p className="eyebrow">A small collection</p>
      <h1>Lyman's Logic Games</h1>
      <p className="tagline">Short games of logic and strategy. Pick one to play.</p>
      <p className="header-store">
        Teaching with these games?{' '}
        <a href={STORE_URL} target="_blank" rel="noopener">Get the classroom worksheets</a>
      </p>
    </header>

    <main>
      <ul className="game-list">
        {games.map(game => (
          <li key={game.href}>
            <a className="game-card" href={game.href}>
              <h2>{game.title}</h2>
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
            <h2>More coming soon</h2>
            <p>New games will appear here as they're added.</p>
          </div>
        </li>
      </ul>

      <section className="store-callout" aria-labelledby="store-heading">
        <div>
          <p className="eyebrow">For teachers</p>
          <h2 id="store-heading">Classroom worksheets</h2>
          <p>
            Strategy packets and worksheets that go with these games, with warm-up puzzles, practice boards and
            answer keys, are available in the Lyman's Logic Games store on <em>Teachers Pay Teachers</em>.
          </p>
        </div>
        <a className="store-button" href={STORE_URL} target="_blank" rel="noopener">
          Visit the store <span aria-hidden="true">↗</span>
          <span className="visually-hidden"> (opens Teachers Pay Teachers in a new tab)</span>
        </a>
      </section>
    </main>

    <SiteFooter />
  </div>
);

export default Landing;
