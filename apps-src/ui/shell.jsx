/* App frame: skip link, substrate, top bar with the three modes, settings sheet, footer credit. */
import { useState } from 'preact/hooks';
import { Icon, Seg, LEVELS, useSettings } from './core.jsx';

export const CREDIT = {
  line1: '© Dr Abhishek Panda, Asst. Professor in Community Medicine',
  line2: 'Govt. Medical College & Hospital, Sundaragada, Odisha',
  email: 'support@dr-abhishekpanda-cm.app',
  whatsapp: '(+91) 700-890-9595',
  whatsappLink: 'https://wa.me/917008909595',
};
CREDIT.lines = [CREDIT.line1, CREDIT.line2, `Email: ${CREDIT.email}; WhatsApp: ${CREDIT.whatsapp}`];

function TopBar({ config, route, onSettings }) {
  const mode = route.view === 'learn' || route.view === 'lesson' ? 'learn'
    : route.view === 'practice' || route.view === 'drill' ? 'practice'
    : route.view === 'tools' || route.view === 'tool' ? 'tools' : '';
  const link = (id, href, label) => <a href={href} aria-current={mode === id ? 'page' : undefined}>{label}</a>;
  return (
    <header class="top">
      <div class="in">
        <a class="brand" href="#/" aria-label={`${config.name} home`}>
          <span class="mark" aria-hidden="true">{config.markLetter}</span>
          <span class="nm">{config.name}</span>
        </a>
        <nav class="modes" aria-label="Modes">
          {link('learn', '#/learn', 'Learn')}
          {link('practice', '#/practice', 'Practice')}
          {link('tools', '#/', 'Tools')}
        </nav>
        <button type="button" class="iconbtn" onClick={onSettings} aria-label="Settings"><Icon name="settings" /></button>
      </div>
    </header>
  );
}

function SettingsSheet({ onClose }) {
  const s = useSettings();
  return (
    <section class="sheet" aria-labelledby="settings-h">
      <h2 id="settings-h">Settings</h2>
      <div class="opt">
        <Seg label="Depth of explanations" value={s.level} onChange={(level) => s.update({ level })}
          options={LEVELS.map((l) => ({ value: l.id, label: l.label, title: l.note }))} />
        <p class="small" style="margin-top:6px">{LEVELS.find((l) => l.id === s.level)?.note}.</p>
      </div>
      <div class="opt">
        <Seg label="Appearance" value={s.theme} onChange={(theme) => s.update({ theme })}
          options={[{ value: 'system', label: 'As device' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
      </div>
      <div class="opt btn-row">
        <a class="btn ghost small" href="#/about" onClick={onClose}>About this app</a>
        <button type="button" class="btn primary small" onClick={onClose}>Done</button>
      </div>
    </section>
  );
}

function Footer({ config }) {
  return (
    <footer class="foot">
      <div class="in">
        <div class="credit">
          <p>{CREDIT.line1}</p>
          <p>{CREDIT.line2}</p>
          <p><span class="nw">Email: <a href={`mailto:${CREDIT.email}`}>{CREDIT.email}</a>;</span>{' '}
            <span class="nw">WhatsApp: <a href={CREDIT.whatsappLink} rel="noopener" target="_blank">{CREDIT.whatsapp}</a></span></p>
        </div>
        <div class="build">
          <span>{config.name} v{config.version}</span>
          <span>Build {typeof __BUILD__ !== 'undefined' ? __BUILD__.id : 'dev'}</span>
          <span>Works offline</span>
        </div>
      </div>
    </footer>
  );
}

export function Shell({ config, route, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div class="app">
      <a class="skip" href="#main">Skip to content</a>
      <div class="grid-bg" aria-hidden="true" />
      <div class="grain" aria-hidden="true" />
      <TopBar config={config} route={route} onSettings={() => setOpen((v) => !v)} />
      <main class="page" id="main" tabIndex={-1}>
        {open ? <SettingsSheet onClose={() => setOpen(false)} /> : null}
        {children}
      </main>
      <Footer config={config} />
    </div>
  );
}
