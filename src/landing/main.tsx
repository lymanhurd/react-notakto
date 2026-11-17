import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Landing from './Landing';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

createRoot(rootElement).render(
  <StrictMode>
    <Landing />
  </StrictMode>
);
