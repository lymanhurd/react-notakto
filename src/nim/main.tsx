import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../shared/theme.css';
import '../shared/play.css';
import './nim.css';
import NimGame from './NimGame';
import SiteFooter from '../shared/SiteFooter';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

createRoot(rootElement).render(
  <StrictMode>
    <div className="page">
      <nav aria-label="Home"><a className="back-link" href="/">← Lyman's Logic Games</a></nav>
      <main id="main">
        <NimGame />
      </main>
      <SiteFooter />
    </div>
  </StrictMode>
);
