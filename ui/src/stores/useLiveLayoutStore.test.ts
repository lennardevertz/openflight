import { beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'openflight.live-layout:v1';

function installBrowser(initial: Record<string, string> = {}) {
  const store = { ...initial };
  const localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
  };
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('window', { localStorage });
  return store;
}

async function loadStore() {
  const module = await import('./useLiveLayoutStore');
  return module.useLiveLayoutStore;
}

describe('useLiveLayoutStore', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('persists a layout per mode and restores it', async () => {
    const storage = installBrowser();
    const store = await loadStore();
    store.getState().setLayout('ball', { order: ['carry', 'ball_speed'], hidden: ['spin'] });

    expect(JSON.parse(storage[STORAGE_KEY])).toEqual({ ball: { order: ['carry', 'ball_speed'], hidden: ['spin'] } });

    vi.resetModules();
    const reloaded = await loadStore();
    expect(reloaded.getState().layouts.ball).toEqual({ order: ['carry', 'ball_speed'], hidden: ['spin'] });
    expect(reloaded.getState().layouts.swing).toBeUndefined();
  });

  it('resets one mode without touching the other', async () => {
    installBrowser();
    const store = await loadStore();
    store.getState().setLayout('ball', { order: ['carry'], hidden: [] });
    store.getState().setLayout('swing', { order: ['swing_best'], hidden: [] });
    store.getState().resetLayout('ball');

    expect(store.getState().layouts).toEqual({ swing: { order: ['swing_best'], hidden: [] } });
  });

  it('ignores malformed stored data', async () => {
    installBrowser({ [STORAGE_KEY]: '{"ball":{"order":"nope"}}' });
    expect((await loadStore()).getState().layouts).toEqual({});

    vi.resetModules();
    installBrowser({ [STORAGE_KEY]: 'not json' });
    expect((await loadStore()).getState().layouts).toEqual({});
  });
});
