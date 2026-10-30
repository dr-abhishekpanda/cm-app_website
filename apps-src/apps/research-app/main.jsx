import { render } from 'preact';
import config from './app.config.js';
import { App } from '../../ui/app.jsx';
import { STAGES, modulesFor } from '../../modules/registry.js';

const modules = modulesFor(config.id, { includePlanned: config.showPlanned });
render(<App config={config} stages={STAGES} modules={modules} />, document.getElementById('app'));

// Offline support. Some browsers refuse service workers (sandboxed frames, some private modes);
// the app must still open there, so failures are ignored.
try {
  const secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && secure) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
  }
} catch { /* no offline copy in this browser */ }
