import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

import './index.css';

function AppRoot() {
  return <App />;
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('JARVIS application root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
