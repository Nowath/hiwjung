"use client";

import Link from "next/link";
import { usePacksLeft, useHydrated } from "@/lib/store";
import { PACKS_PER_MEAL } from "@/lib/meal";

export function TopBar({ back }: { back?: string }) {
  const hydrated = useHydrated();
  const left = usePacksLeft();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 bg-cream/90 px-4 py-3 backdrop-blur">
      {back && (
        <Link href={back} className="btn h-10 w-10 bg-white !p-0 text-lg" aria-label="ย้อนกลับ">
          ←
        </Link>
      )}
      <Link href="/" className="btn bg-pink !px-3 !py-1.5 text-lg text-white">
        กินไรดี
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2.5 py-1 text-xs font-semibold">
          {Array.from({ length: PACKS_PER_MEAL }, (_, i) => (
            <span
              key={i}
              className={`inline-block h-3.5 w-2.5 rounded-[3px] border-[1.5px] border-ink ${hydrated && i < left ? "bg-sun" : "bg-cream"}`}
            />
          ))}
          <span className="ml-1">ซอง</span>
        </span>
        <Link href="/collection" className="btn bg-sky !px-3 !py-1.5 text-sm text-white">
          สมุดการ์ด
        </Link>
      </div>
    </header>
  );
}
