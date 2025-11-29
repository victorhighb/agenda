import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type Schedule = {
  id: string;
  date: string;       // YYYY-MM-DD
  title: string;
  clientId: string;
  clientName: string;
  value?: number;
  payment?: string | null;
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
};

type Ctx = {
  schedules: Schedule[];
  addSchedule: (s: Omit<Schedule, "id"> & { id?: string }) => Schedule;
  updateSchedule: (id: string, patch: Partial<Schedule>) => Schedule | null;
  removeSchedule: (id: string) => void;
};

const SchedulesContext = createContext<Ctx | null>(null);

export function SchedulesProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const addSchedule: Ctx["addSchedule"] = (s) => {
    const id = s.id ?? String(Date.now());
    const sched: Schedule = { ...s, id };
    setSchedules((prev) => [sched, ...prev]);
    return sched;
  };

  const updateSchedule: Ctx["updateSchedule"] = (id, patch) => {
    let updated: Schedule | null = null;
    setSchedules((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        updated = { ...it, ...patch, id: it.id };
        return updated!;
      })
    );
    return updated;
  };

  const removeSchedule: Ctx["removeSchedule"] = (id) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const value = useMemo(
    () => ({ schedules, addSchedule, updateSchedule, removeSchedule }),
    [schedules]
  );

  return <SchedulesContext.Provider value={value}>{children}</SchedulesContext.Provider>;
}

export function useSchedules() {
  const ctx = useContext(SchedulesContext);
  if (!ctx) throw new Error("useSchedules must be used within SchedulesProvider");
  return ctx;
}