"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { TopBar } from "@/components/TopBar";
import { FoodCard } from "@/components/FoodCard";
import { CardShareButtons } from "@/components/CardActions";
import { canteens, getCanteen, getShop, menus } from "@/lib/data";
import { useHydrated, useStore } from "@/lib/store";
import { encodeCollection, shareLink } from "@/lib/share";
import type { Menu } from "@/lib/types";

type Sort = "rarity" | "latest";

export default function CollectionPage() {
  const root = useRef<HTMLElement>(null);
  const hydrated = useHydrated();
  const collection = useStore((s) => s.collection);
  const resetAll = useStore((s) => s.resetAll);
  const [canteen, setCanteen] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("rarity");
  const [open, setOpen] = useState<Menu | null>(null);
  const [msg, setMsg] = useState("");

  const owned = useMemo(() => (hydrated ? collection : {}), [hydrated, collection]);
  const ownedCount = Object.keys(owned).length;
  const progress = Math.round((ownedCount / menus.length) * 100);

  const list = useMemo(() => {
    const filtered = menus.filter((m) => m.type === "main" && (canteen === "all" || m.canteenId === canteen));
    return filtered.sort((a, b) => {
      const oa = owned[a.id], ob = owned[b.id];
      if (!!oa !== !!ob) return oa ? -1 : 1; // owned first, silhouettes last
      if (sort === "latest" && oa && ob) return ob.lastAt.localeCompare(oa.lastAt);
      if (a.rarity !== b.rarity) return a.rarity === "rare" ? -1 : 1;
      return a.id.localeCompare(b.id);
    });
  }, [canteen, sort, owned]);

  // grid deals in like cards whenever the filter / sort changes
  useGSAP(
    () => {
      gsap.from(".slot", { y: 30, opacity: 0, rotation: () => gsap.utils.random(-6, 6), stagger: 0.05, duration: 0.45, ease: "back.out(1.6)" });
    },
    { scope: root, dependencies: [canteen, sort, hydrated] },
  );
  useGSAP(
    () => {
      gsap.fromTo(".progress-fill", { scaleX: 0 }, { scaleX: progress / 100, duration: 0.9, ease: "power3.out", delay: 0.2 });
    },
    { scope: root, dependencies: [progress] },
  );

  const shareCollection = async () => {
    const d = encodeCollection(Object.values(owned));
    const r = await shareLink(`${location.origin}/c?d=${d}`, "สมุดการ์ดอาหารของฉัน");
    if (r === "copied") {
      setMsg("คัดลอกลิงก์แล้ว ✓");
      setTimeout(() => setMsg(""), 2000);
    }
  };

  return (
    <>
      <TopBar back="/" />
      <main ref={root} className="flex-1 px-5 pb-10">
        <section className="pt-4">
          <h1 className="title-pop text-[2.2rem]">
            สมุด<span className="text-pink">การ์ด</span>ของฉัน
          </h1>
          <div className="pop-box mt-4 bg-butter p-4">
            <div className="flex items-end justify-between">
              <p className="font-display text-sm font-semibold">
                เก็บแล้ว <span className="text-3xl text-pink">{ownedCount}</span> / {menus.length} เมนู
              </p>
              <button disabled={!ownedCount} onClick={shareCollection} className="btn bg-pink !py-2 text-sm text-white disabled:opacity-40">
                แชร์สมุด
              </button>
            </div>
            <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-ink bg-white">
              <div className="progress-fill h-full origin-left bg-[repeating-linear-gradient(-45deg,var(--pink)_0_8px,#ef7aa8_8px_16px)]" />
            </div>
            <p className="font-display mt-1 h-4 text-right text-xs font-semibold text-pink">{msg}</p>
          </div>
        </section>

        <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-2">
          {[{ id: "all", short: "ทั้งหมด" }, ...canteens].map((c) => (
            <button
              key={c.id}
              onClick={() => setCanteen(c.id)}
              className={`font-display shrink-0 rounded-full border-2 border-ink px-3.5 py-1 text-sm font-semibold transition ${
                canteen === c.id ? "bg-ink text-cream" : "bg-white"
              }`}
            >
              {c.short}
            </button>
          ))}
        </div>
        <div className="mt-1 mb-4 flex items-center gap-3 text-sm">
          <span className="text-ink/60">เรียงตาม</span>
          {(["rarity", "latest"] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`font-display font-semibold ${sort === s ? "text-pink underline decoration-2 underline-offset-4" : "text-ink/50"}`}
            >
              {s === "rarity" ? "ความหายาก" : "ล่าสุด"}
            </button>
          ))}
        </div>

        <ul className="grid grid-cols-3 gap-x-3 gap-y-4">
          {list.map((m) => {
            const entry = owned[m.id];
            return (
              <li key={`${canteen}-${sort}-${m.id}`} className="slot relative">
                {entry ? (
                  <button onClick={() => setOpen(m)} className="block w-full transition-transform hover:-translate-y-1 hover:rotate-1">
                    <FoodCard menu={m} tilt={false} />
                    {entry.count > 1 && (
                      <span className="font-display absolute -top-2 -right-2 rotate-12 rounded-full border-2 border-ink bg-sun px-2 text-xs font-bold">
                        x{entry.count}
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="card-3d overflow-hidden border-[2.5px] border-dashed border-ink/35 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.image} alt="" className="silhouette h-full w-full object-cover" />
                    <span className="font-display absolute inset-0 grid place-items-center text-3xl font-bold text-ink/40">?</span>
                  </div>
                )}
                <p className="font-display mt-1.5 text-center text-[11px] font-semibold text-ink/50">#{m.id}</p>
              </li>
            );
          })}
        </ul>

        {!ownedCount && hydrated && (
          <div className="mt-8 text-center">
            <p className="text-ink/70">ยังไม่มีการ์ดเลย ไปเปิดซองแรกกัน!</p>
            <Link href="/" className="btn mt-3 bg-sun">
              เปิดซองเลย →
            </Link>
          </div>
        )}

        <button
          onClick={() => confirm("ล้างการ์ดและจำนวนซองทั้งหมด? (สำหรับ demo)") && resetAll()}
          className="mt-12 block w-full text-center text-xs text-ink/40 underline"
        >
          รีเซ็ตข้อมูล (demo)
        </button>
      </main>

      {open && <CardModal menu={open} count={owned[open.id]?.count ?? 0} onClose={() => setOpen(null)} />}
    </>
  );
}

function CardModal({ menu, count, onClose }: { menu: Menu; count: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.from(".modal-bg", { opacity: 0, duration: 0.25 });
      gsap.from(".modal-card", { y: 120, scale: 0.6, rotation: -12, duration: 0.55, ease: "back.out(1.6)" });
      gsap.from(".modal-ui", { y: 20, opacity: 0, stagger: 0.06, delay: 0.2, duration: 0.35 });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="modal-bg dots-bg absolute inset-0 bg-cream/95" />
      <div className="relative w-full max-w-[290px]" onClick={(e) => e.stopPropagation()}>
        <div className="modal-card">
          <FoodCard menu={menu} priority />
        </div>
        <div className="modal-ui mt-5 text-center">
          <p className="font-display text-xl font-bold">{menu.name}</p>
          <p className="text-sm text-ink/70">
            {getCanteen(menu.canteenId)?.short} · {getShop(menu.shopId)?.name} · {menu.price}฿ · ได้มาแล้ว {count} ครั้ง
          </p>
        </div>
        <div className="modal-ui mt-4">
          <CardShareButtons menu={menu} />
        </div>
        <button onClick={onClose} className="modal-ui btn mx-auto mt-1 flex bg-white !py-1.5 text-sm">
          ปิด ✕
        </button>
      </div>
    </div>
  );
}
