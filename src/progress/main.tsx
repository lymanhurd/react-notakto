import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../shared/theme.css';
import './progress.css';
import Progress from './Progress';
import SiteFooter from '../shared/SiteFooter';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

createRoot(rootElement).render(
  <StrictMode>
    <div className="page">
      <nav aria-label="Home"><a className="back-link" href="/">← Lyman's Logic Games</a></nav>
      <Progress />
      <SiteFooter showStore={false} />
    </div>
  </StrictMode>
);
