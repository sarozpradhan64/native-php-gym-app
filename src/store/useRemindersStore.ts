import { create } from 'zustand';

export interface DayReminder {
  day: number;    // 0 = Sunday … 6 = Saturday
  enabled: boolean;
  hour: number;   // 0-23
  minute: number; // 0-59
}

const DEFAULT_REMINDERS: DayReminder[] = Array.from({ length: 7 }, (_, i) => ({
  day: i,
  enabled: false,
  hour: 7,
  minute: 0,
}));

interface RemindersStore {
  reminders: DayReminder[];
  setReminders: (reminders: DayReminder[]) => void;
  updateDay: (day: number, patch: Partial<Omit<DayReminder, 'day'>>) => void;
}

export const useRemindersStore = create<RemindersStore>((set) => ({
  reminders: DEFAULT_REMINDERS,
  setReminders: (reminders) => set({ reminders }),
  updateDay: (day, patch) =>
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.day === day ? { ...r, ...patch } : r
      ),
    })),
}));
