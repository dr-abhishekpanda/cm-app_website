/* Index views: the Tools catalogue (home), the Learn and Practice indexes, About and Not found. */
import { useState } from 'preact/hooks';
import { Icon, PageHead, Callout } from '../../ui/core.jsx';

function matches(m, q) {
  if (!q) return true;
  const hay = `${m.title} ${m.summary} ${m.keywords || ''} ${m.tag || ''}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

function ModuleCard({ m, href, cta, phase }) {
  if (m.status !== 'ready') {
    return (
      <div class="card planned" aria-disabled="true">
        <h3>{m.title}</h3>
        <p>{m.summary}</p>
        <div class="foot"><span class="meta"><span class="pill ink">{m.tag}</span><span class="pill amber">Phase {phase || m.phase}</span></span><span class="go" style="color:var(--ink-faint)">In build</span></div>
      </div>
    );
  }
  return (
    <a class="card" href={href}>
      <h3>{m.title}</h3>
      <p>{m.summary}</p>
      <div class="foot"><span class="meta"><span class="pill teal">{m.tag}</span></span><span class="go">{cta} <span class="arw">{'→'}</span></span></div>
    </a>
  );
}

function Catalogue({ config, stages, modules, kind }) {
  const [q, setQ] = useState('');
  const hrefFor = (m) => (kind === 'tool' ? `#/tool/${m.id}` : kind === 'lesson' ? `#/learn/${m.id}` : `#/practice/${m.id}`);
  const cta = kind === 'tool' ? 'Open the tool' : kind === 'lesson' ? 'Read the lesson' : 'Practise';
  const shown = modules.filter((m) => matches(m, q) && (kind === 'tool' || m.status !== 'ready' || m[kind === 'lesson' ? 'lesson' : 'practice']));
  const ready = shown.filter((m) => m.status === 'ready').length;
  return (
    <div>
      <label class="search">
        <Icon name="search" />
        <span class="vh">Search</span>
        <input type="search" placeholder={kind === 'tool' ? 'Search tools: sample size, kappa, odds ratio…' : 'Search topics'} value={q} onInput={(e) => setQ(e.currentTarget.value)} />
      </label>
      <p class="small">{ready} ready{config.showPlanned ? `, ${shown.length - ready} in build` : ''}{q ? ` for "${q}"` : ''}.</p>
      {stages.map((st) => {
        const list = shown.filter((m) => m.stage === st.id);
        if (!list.length) return null;
        return (
          <section class="stage" aria-labelledby={`st-${st.id}`}>
            <h2 id={`st-${st.id}`}>{st.label}</h2>
            <p>{st.blurb}</p>
            <div class="cards">{list.map((m) => <ModuleCard m={m} href={hrefFor(m)} cta={cta} phase={kind === 'tool' ? null : 4} />)}</div>
          </section>
        );
      })}
      {shown.length === 0 ? <div class="empty">Nothing matches "{q}". Try a shorter word, such as "kappa" or "sample".</div> : null}
    </div>
  );
}

export function ToolsHome({ config, stages, modules }) {
  return (
    <div>
      <PageHead title={<span>{config.headline[0]} <em>{config.headline[1]}</em></span>} subhead={config.tagline} lede={config.lede} />
      {config.showPlanned ? (
        <div class="notice"><span>Review build: cards marked "In build" show what each phase adds. Only ready tools are live.</span><a class="sec-link" href="#/about">About</a></div>
      ) : null}
      <Catalogue config={config} stages={stages} modules={modules} kind="tool" />
    </div>
  );
}

export function LearnIndex({ config, stages, modules }) {
  return (
    <div>
      <PageHead title="Lessons" lede="Short lessons tied to each tool. Set the depth in Settings: Basic, Intermediate or Advanced." />
      <Catalogue config={config} stages={stages} modules={modules} kind="lesson" />
    </div>
  );
}

export function PracticeIndex({ config, stages, modules }) {
  return (
    <div>
      <PageHead title="Practice Sets" lede="Problems with fresh numbers every time, checked as you go, with the full working." />
      <Catalogue config={config} stages={stages} modules={modules} kind="practice" />
    </div>
  );
}

export function About({ config }) {
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }]} title={config.name} lede={config.description} />
      <div class="prose">
        <h2>How it works</h2>
        <p>Everything runs on your phone or computer. Nothing you type or upload leaves the device, and the app keeps working without internet once it has opened once.</p>
        <h2>Accuracy</h2>
        <p>Every calculation is tested against independent reference values before each release: SciPy and 40-digit mpmath for the statistical distributions in this version. The test log is kept with the source.</p>
        <Callout mark="Your judgement">
          <p>The tools compute; they do not decide your study design or interpret your findings for you. Check the method against your protocol and a standard text before you report it.</p>
        </Callout>
        <h2>Part of the #CM-APP series</h2>
        <p>{config.name} shares one tested engine with #EPI-APP, #BIOSTATS-APP, #CM-EPI-BIO-APP and the #CM-APP toolkit, so the same data give the same answer in every app.</p>
        <p class="small">Version {config.version} · build {typeof __BUILD__ !== 'undefined' ? `${__BUILD__.id}, ${__BUILD__.date}` : 'dev'}</p>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div>
      <PageHead title="Page not found" lede="That address does not match a tool, lesson or practice set in this app." />
      <a class="btn primary" href="#/">Go to the tools <span class="arw">{'→'}</span></a>
    </div>
  );
}
