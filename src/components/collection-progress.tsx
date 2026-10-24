"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { menus } from "@/lib/data";
import { useHydrated, useStore } from "@/lib/store";

/** การ์ดสรุปความคืบหน้าบนหน้าแรก — ชวนให้กลับมาสะสมต่อ */
export function CollectionProgress() {
  const collection = useStore((s) => s.collection);
  const hydrated = useHydrated();
  const got = hydrated ? Object.keys(collection).length : 0;
  const pct = Math.round((got / menus.length) * 100);

  return (
    <Link
      href="/collection"
      className="group flex items-center gap-4 rounded-card bg-card p-4 shadow-card outline-none transition-colors duration-(--dur-fast) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1">
        <p className="text-base text-muted-foreground">คอลเลกชันของฉัน</p>
        <p className="font-heading text-xl font-bold">
          {got} <span className="text-muted-foreground">/ {menus.length} เมนู</span>
        </p>
        {/* แถบความคืบหน้าใช้ scaleX แทน width เพื่อไม่ให้เบราว์เซอร์คำนวณ layout ใหม่ */}
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full origin-left rounded-full bg-primary transition-transform duration-(--dur-slow) ease-(--ease-out)"
            style={{ transform: `scaleX(${pct / 100})` }}
          />
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-(--dur-fast) group-hover:translate-x-0.5" />
    </Link>
  );
}
