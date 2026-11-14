import { create } from 'zustand';
import type { LiveLayout } from '../components/panel/liveMetrics';

const STORAGE_KEY = 'openflight.live-layout:v1';

/** Ball-strike and swing-speed sessions have different tiles, so each keeps its own layout. */
export type LiveLayoutMode = 'ball' | 'swing';

type LiveLayouts = Partial<Record<LiveLayoutMode, LiveLayout>>;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function readStoredLayouts(): LiveLayouts {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    const layouts: LiveLayouts = {};
    for (const mode of ['ball', 'swing'] as const) {
      const layout = (parsed as Record<string, unknown> | null)?.[mode] as Partial<LiveLayout> | undefined;
      if (layout && isStringArray(layout.order) && isStringArray(layout.hidden)) {
        layouts[mode] = { order: layout.order, hidden: layout.hidden };
      }
    }
    return layouts;
  } catch {
    return {};
  }
}

function persistLayouts(layouts: LiveLayouts): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  } catch {
    // Storage can be unavailable; the layout still applies for this session.
  }
}

interface LiveLayoutState {
  layouts: LiveLayouts;
  setLayout: (mode: LiveLayoutMode, layout: LiveLayout) => void;
  resetLayout: (mode: LiveLayoutMode) => void;
}

/** Which Live tiles are shown and in what order. Persisted per kiosk. */
export const useLiveLayoutStore = create<LiveLayoutState>((set, get) => ({
  layouts: readStoredLayouts(),
  setLayout: (mode, layout) => {
    const layouts = { ...get().layouts, [mode]: layout };
    persistLayouts(layouts);
    set({ layouts });
  },
  resetLayout: (mode) => {
    const layouts = { ...get().layouts };
    delete layouts[mode];
    persistLayouts(layouts);
    set({ layouts });
  },
}));
