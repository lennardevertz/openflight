import { create } from 'zustand';
import type { HistoryShot, HistorySnapshot } from '../types/history';

/** Mirror of the server's long-term history for the profile last requested. */
interface HistoryState {
  profileId: string | null;
  shots: HistoryShot[];
  sessionCount: number;
  loaded: boolean;
  applySnapshot: (snapshot: HistorySnapshot) => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  profileId: null,
  shots: [],
  sessionCount: 0,
  loaded: false,
  applySnapshot: (snapshot) => {
    if (!snapshot || !Array.isArray(snapshot.shots)) return;
    set({
      profileId: snapshot.profile_id,
      shots: snapshot.shots,
      sessionCount: snapshot.session_count ?? 0,
      loaded: true,
    });
  },
}));
