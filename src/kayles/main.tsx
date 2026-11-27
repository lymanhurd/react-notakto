import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../shared/theme.css';
import '../shared/play.css';
import './kayles.css';
import KaylesGame from './KaylesGame';
import SiteFooter from '../shared/SiteFooter';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

createRoot(rootElement).render(
  <StrictMode>
    <div className="page">
      <a className="back-link" href="/">← Lyman's Logic Games</a>
      <main id="main">
        <KaylesGame />
      </main>
      <SiteFooter />
    </div>
  </StrictMode>
);
