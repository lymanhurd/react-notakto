import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../shared/theme.css';
import '../shared/play.css';
import '../nim/nim.css';
import NimGame from '../nim/NimGame';
import SiteFooter from '../shared/SiteFooter';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

createRoot(rootElement).render(
  <StrictMode>
    <div className="page">
      <a className="back-link" href="/">← Lyman's Logic Games</a>
      <NimGame misere />
      <SiteFooter />
    </div>
  </StrictMode>
);
