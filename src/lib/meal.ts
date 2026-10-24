export const PACKS_PER_MEAL = 3;

type SlotName = "breakfast" | "lunch" | "dinner" | "late";

// start time (minutes since midnight) of each slot, in order
const SLOTS: { name: SlotName; label: string; start: number }[] = [
  { name: "breakfast", label: "มื้อเช้า", start: 6 * 60 },
  { name: "lunch", label: "มื้อกลางวัน", start: 10 * 60 + 30 },
  { name: "dinner", label: "มื้อเย็น", start: 15 * 60 },
  { name: "late", label: "มื้อดึก", start: 21 * 60 },
];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function currentSlot(now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes();
  // before 06:00 still belongs to last night's late slot
  if (mins < SLOTS[0].start) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return { ...SLOTS[3], key: `${ymd(yesterday)}:late` };
  }
  const slot = [...SLOTS].reverse().find((s) => mins >= s.start)!;
  return { ...slot, key: `${ymd(now)}:${slot.name}` };
}

/** Milliseconds until the next meal slot starts. */
export function msUntilNextSlot(now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes();
  const next = SLOTS.find((s) => s.start > mins);
  const target = new Date(now);
  target.setSeconds(0, 0);
  if (next) {
    target.setHours(0, next.start, 0, 0);
  } else {
    target.setDate(target.getDate() + 1);
    target.setHours(0, SLOTS[0].start, 0, 0);
  }
  return target.getTime() - now.getTime();
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
