"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";
import type { CollectionEntry, PackUsage } from "./types";
import { currentSlot, PACKS_PER_MEAL } from "./meal";

interface State {
  collection: Record<string, CollectionEntry>;
  packUsage: PackUsage;
  quizAnswers: Record<string, string[]>; // mock quiz, not used for filtering yet
  addCard: (menuId: string) => void;
  consumePack: () => boolean;
  setAnswer: (q: string, a: string[]) => void;
  resetAll: () => void;
  resetPacks: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      collection: {},
      packUsage: { mealSlot: "", opened: 0 },
      quizAnswers: {},
      addCard: (menuId) =>
        set((s) => {
          const now = new Date().toISOString();
          const prev = s.collection[menuId];
          return {
            collection: {
              ...s.collection,
              [menuId]: prev
                ? { ...prev, count: prev.count + 1, lastAt: now }
                : { menuId, count: 1, firstAt: now, lastAt: now },
            },
          };
        }),
      consumePack: () => {
        const key = currentSlot().key;
        const opened = get().packUsage.mealSlot === key ? get().packUsage.opened : 0;
        if (opened >= PACKS_PER_MEAL) return false;
        set({ packUsage: { mealSlot: key, opened: opened + 1 } });
        return true;
      },
      setAnswer: (q, a) => set((s) => ({ quizAnswers: { ...s.quizAnswers, [q]: a } })),
      resetAll: () => set({ collection: {}, packUsage: { mealSlot: "", opened: 0 } }),
      resetPacks: () => set({ packUsage: { mealSlot: "", opened: 0 } }),
    }),
    {
      name: "kinraidee",
      partialize: (s) => ({ collection: s.collection, packUsage: s.packUsage, quizAnswers: s.quizAnswers }),
    },
  ),
);

/** Packs left in the current meal slot (resets automatically when the slot key changes). */
export function usePacksLeft() {
  const usage = useStore((s) => s.packUsage);
  const hydrated = useHydrated();
  if (!hydrated) return PACKS_PER_MEAL; // the clock is only read on the client
  const opened = usage.mealSlot === currentSlot().key ? usage.opened : 0;
  return Math.max(0, PACKS_PER_MEAL - opened);
}

const noop = () => () => {};
/** false during SSR / first render, true after hydration — avoids localStorage mismatches. */
export const useHydrated = () =>
  useSyncExternalStore(noop, () => true, () => false);

/** ค่าซองที่เหลือ ณ ตอนเรียก (นอก render) — ใช้ตัดสินตอนเริ่มรอบว่าซองหมดหรือยัง */
export function packsLeftNow() {
  const usage = useStore.getState().packUsage;
  const opened = usage.mealSlot === currentSlot().key ? usage.opened : 0;
  return Math.max(0, PACKS_PER_MEAL - opened);
}
