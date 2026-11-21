/* The study being planned: question, design, objectives, hypotheses and variables, shared by the
 * planning tools and kept in this browser's storage (one plan per app), so a reload or a visit next
 * week finds it again. Nothing leaves the device. */
import { useState, useEffect } from 'preact/hooks';
import { store } from './core.jsx';

let current = null, key = null;
const subs = new Set();
function load(app) {
  const k = `${app || 'research'}:plan`;
  if (k !== key) { key = k; current = store.get(k, {}) || {}; }
  return current;
}

/** [plan, update(patch), clear()] for the app's plan. */
export function usePlan(app) {
  const [plan, set] = useState(() => load(app));
  useEffect(() => { subs.add(set); set(load(app)); return () => subs.delete(set); }, [app]);
  const publish = (next) => { current = next; store.set(key, current); subs.forEach((f) => f(current)); };
  const update = (patch) => publish({ ...load(app), ...patch, updated: new Date().toISOString() });
  const clear = () => publish({});
  return [plan, update, clear];
}
