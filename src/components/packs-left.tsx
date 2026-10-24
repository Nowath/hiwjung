"use client";

import { Package } from "lucide-react";
import { PACKS_PER_MEAL } from "@/lib/meal";
import { usePacksLeft } from "@/lib/store";
import { cn } from "@/lib/utils";

/** ตัวบอกซองที่เหลือในมื้อนี้ — นับจาก localStorage จึงต้องเป็น client */
export function PacksLeft({ className }: { className?: string }) {
  const left = usePacksLeft();
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-base font-medium",
        left ? "bg-secondary text-secondary-foreground" : "bg-badge text-muted-foreground",
        className,
      )}
      aria-label={`เหลือ ${left} จาก ${PACKS_PER_MEAL} ซองในมื้อนี้`}
    >
      <Package className="size-4" />
      {left}/{PACKS_PER_MEAL}
    </span>
  );
}
