import Game from './Game';
import SiteFooter from './shared/SiteFooter';

const App = () => (
  <div className="page">
    <a className="back-link" href="/">← Lyman's Logic Games</a>

    <main id="main">
      <Game />
    </main>

    <SiteFooter />
  </div>
);

export default App;
