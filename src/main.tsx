import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { MiniHudWindow } from './components/MiniHudWindow';
import { WaypointOverlayWindow } from './components/WaypointOverlayWindow';
import './index.css';

/**
 * Detects current window route based on URL hash, query parameters, or pathname.
 * - Mini-HUD Window: `/#/mini-hud`, `/?window=mini-hud`, `/mini-hud`
 * - Waypoint Overlay: `/#/overlay`, `/?window=overlay`, `/overlay`
 * - Main Dashboard: Default `/`
 */
function getWindowRoute(): 'main' | 'mini-hud' | 'overlay' {
  if (typeof window === 'undefined') return 'main';

  const hash = (window.location.hash || '').toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const windowParam = (search.get('window') || '').toLowerCase();
  const pathname = (window.location.pathname || '').toLowerCase();

  if (
    hash.includes('mini-hud') ||
    hash.includes('minihud') ||
    windowParam === 'mini-hud' ||
    windowParam === 'minihud' ||
    pathname.endsWith('/mini-hud')
  ) {
    return 'mini-hud';
  }

  if (
    hash.includes('overlay') ||
    windowParam === 'overlay' ||
    pathname.endsWith('/overlay')
  ) {
    return 'overlay';
  }

  return 'main';
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const route = getWindowRoute();

if (route === 'mini-hud' || route === 'overlay') {
  document.documentElement.classList.add('transparent-window');
  document.body.classList.add('transparent-window');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    {route === 'mini-hud' ? (
      <MiniHudWindow />
    ) : route === 'overlay' ? (
      <WaypointOverlayWindow />
    ) : (
      <App />
    )}
  </StrictMode>
);

