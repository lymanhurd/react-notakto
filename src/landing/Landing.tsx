import '../shared/theme.css';
import './landing.css';
import { games } from './games';
import SiteFooter from '../shared/SiteFooter';

const Landing = () => (
  <div className="page landing">
    <header className="landing-header">
      <p className="eyebrow">A small collection</p>
      <h1>Lyman's Logic Games</h1>
      <p className="tagline">Short games of logic and strategy. Pick one to play.</p>
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
    </main>

    <SiteFooter />
  </div>
);

export default Landing;
