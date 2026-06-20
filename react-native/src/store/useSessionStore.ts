import { create } from 'zustand';

interface SessionState {
  activeSessionId: number | null;
  startSession: (id: number) => void;
  endSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessionId: null,
  startSession: (id) => set({ activeSessionId: id }),
  endSession: () => set({ activeSessionId: null }),
}));
