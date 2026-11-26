import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../shared/theme.css';
import './privacy.css';
import Privacy from './Privacy';
import SiteFooter from '../shared/SiteFooter';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

createRoot(rootElement).render(
  <StrictMode>
    <div className="page">
      <a className="back-link" href="/">← Lyman's Logic Games</a>
      <Privacy />
      <SiteFooter showStore={false} />
    </div>
  </StrictMode>
);
