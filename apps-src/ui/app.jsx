/* The app: routes to views. Each app entry passes its config and module list. */
import { useEffect } from 'preact/hooks';
import { SettingsProvider, useRoute } from './core.jsx';
import { Shell } from './shell.jsx';
import { ToolsHome, LearnIndex, PracticeIndex, About, NotFound } from '../modules/home/views.jsx';

function View({ config, stages, modules, route }) {
  const ready = modules.filter((m) => m.status === 'ready');
  const find = (id, key) => ready.find((m) => m.id === id && m[key]);
  switch (route.view) {
    case 'tools': return <ToolsHome config={config} stages={stages} modules={modules} />;
    case 'learn': return <LearnIndex config={config} stages={stages} modules={modules} />;
    case 'practice': return <PracticeIndex config={config} stages={stages} modules={modules} />;
    case 'about': return <About config={config} />;
    case 'tool': { const m = find(route.id, 'tool'); return m ? <m.tool config={config} /> : <NotFound />; }
    case 'lesson': { const m = find(route.id, 'lesson'); return m ? <m.lesson config={config} /> : <NotFound />; }
    case 'drill': { const m = find(route.id, 'practice'); return m ? <m.practice config={config} /> : <NotFound />; }
    default: return <NotFound />;
  }
}

function Titled({ config, route, modules }) {
  // Keep the browser tab title in step with the page.
  useEffect(() => {
    const m = modules.find((x) => x.id === route.id);
    const part = route.view === 'learn' ? 'Learn' : route.view === 'practice' ? 'Practice' : route.view === 'about' ? 'About' : m ? m.title : '';
    document.title = part ? `${part} · ${config.name}` : `${config.name} · ${config.title}`;
  }, [route.view, route.id]);
  return null;
}

export function App({ config, stages, modules }) {
  const route = useRoute();
  return (
    <SettingsProvider appId={config.id}>
      <Titled config={config} route={route} modules={modules} />
      <Shell config={config} route={route}>
        <View config={config} stages={stages} modules={modules} route={route} />
      </Shell>
    </SettingsProvider>
  );
}
