"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { LibraryBig, Package, RotateCcw, X } from "lucide-react";
import { CardShareButtons } from "@/components/share-buttons";
import { Button, buttonVariants } from "@/components/ui/button";
import { PACK_NAME } from "@/config/flow";
import { getShop } from "@/lib/data";
import { formatCountdown, msUntilNextSlot, PACKS_PER_MEAL } from "@/lib/meal";
import { drawPack } from "@/lib/pack";
import { packsLeftNow, useHydrated, usePacksLeft, useStore } from "@/lib/store";
import type { Canteen } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BoosterPack } from "./booster-pack";
import { DealCard, PreviewCard } from "./deal-card";
import { createDirector, THUMB_ROW_H, type Director, type Phase } from "./director";

/** เวทีมืดเต็มจอ — แต่ละรอบ (ซอง) remount ใหม่ทั้งก้อน ให้ GSAP เริ่มจาก DOM สะอาดทุกครั้ง */
export function PackStage({ canteen }: { canteen: Canteen }) {
  const hydrated = useHydrated();
  const [round, setRound] = useState(0);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,var(--stage-bg),var(--stage-bg-deep)_75%)] text-stage-fg">
      {/* สุ่มซองและอ่านจำนวนซองจาก localStorage ได้หลัง hydrate เท่านั้น */}
      {hydrated && <PackRound key={round} canteen={canteen} onNext={() => setRound((r) => r + 1)} />}
    </div>
  );
}

function PackRound({ canteen, onNext }: { canteen: Canteen; onNext: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLDivElement>(null);
  const fxLayer = useRef<HTMLDivElement>(null);
  const sparkleLayer = useRef<HTMLDivElement>(null);
  const director = useRef<Director | null>(null);

  const [cards] = useState(() => drawPack(canteen.id));
  const [phase, setPhase] = useState<Phase>(() => (packsLeftNow() > 0 ? "ready" : "empty"));
  const [selected, setSelected] = useState<number | null>(null);
  const [cur, setCur] = useState(0);
  const packsLeft = usePacksLeft();

  // animation ทั้งหมดอยู่ใน director (ดู director.ts) — React ทำแค่ render UI ตามเฟส
  useGSAP(
    (_, safe) => {
      const d = createDirector({
        root: root.current!,
        table: table.current!,
        fx: fxLayer.current!,
        sparkles: sparkleLayer.current!,
        cards,
        phase,
        safe: safe! as Parameters<typeof createDirector>[0]["safe"],
        setPhase,
        setSelected,
        setCur,
      });
      director.current = d;
      return d.intro();
    },
    { scope: root },
  );

  // การ์ดใหญ่ของ gallery remount ตาม key — เล่นท่าพลิกเข้าใน layout effect ก่อน paint
  useGSAP(
    () => {
      if (phase === "choose") director.current?.showPreview();
    },
    { dependencies: [phase, selected] },
  );

  // ฉลองต้องรอให้ปุ่มของเฟส saved render ก่อน จึงเรียกจาก effect ไม่ใช่ตอนกดปุ่ม
  useEffect(() => {
    if (phase === "saved") director.current?.celebrate();
  }, [phase]);

  const picked = selected !== null ? cards[selected] : null;

  return (
    <div ref={root} className="absolute inset-0">
      {/* ---------- ฉากหลัง ---------- */}
      <div className="stage-glow pointer-events-none absolute top-[42%] left-1/2 size-[130vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.665_0.161_5.8/0.35),transparent_60%)]" />
      <div
        className="rays pointer-events-none absolute top-[42%] left-1/2 size-[220vmax] opacity-60"
        style={{
          backgroundImage: "repeating-conic-gradient(from 0deg, oklch(0.665 0.161 5.8 / 0.22) 0deg 5deg, transparent 5deg 15deg)",
          maskImage: "radial-gradient(circle, black 0%, transparent 32%)",
        }}
      />
      <div
        className="rays-gold pointer-events-none absolute top-[42%] left-1/2 size-[220vmax] opacity-0"
        style={{
          backgroundImage: "repeating-conic-gradient(from 7deg, oklch(0.88 0.12 88 / 0.4) 0deg 4deg, transparent 4deg 12deg)",
          maskImage: "radial-gradient(circle, black 0%, transparent 34%)",
        }}
      />
      <div ref={sparkleLayer} className="pointer-events-none absolute inset-0" />

      {/* ---------- คอลัมน์มือถือ ---------- */}
      <div className="camera relative mx-auto flex h-dvh max-w-md flex-col px-4 pt-[env(safe-area-inset-top)] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="stage-chrome flex h-16 shrink-0 items-center gap-2">
          <Link
            href="/"
            aria-label="ออกไปหน้าแรก"
            className="-ml-2 grid size-11 place-items-center rounded-full outline-none transition-colors duration-(--dur-fast) hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <X className="size-6" />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-bold">{PACK_NAME}</p>
            <p className="truncate text-sm text-stage-fg-soft">{canteen.name}</p>
          </div>
          <span className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-base" aria-label={`เหลือ ${packsLeft} ซองในมื้อนี้`}>
            <Package className="size-4" />
            {packsLeft}/{PACKS_PER_MEAL}
          </span>
        </header>

        {/* โต๊ะ: การ์ดเป็น 2D ซ้อนกันด้วย z-index ธรรมดา (perspective อยู่ในแต่ละใบไว้แค่ตอนพลิก) */}
        <div ref={table} className="relative grid min-h-0 flex-1 place-items-center">
          <div className="shock pointer-events-none col-start-1 row-start-1 size-40 rounded-full border-2 border-white opacity-0 shadow-[0_0_40px_10px_oklch(0.665_0.161_5.8/0.6)]" />

          {/* ซองอยู่ต่อจนถึงเฟส reveal เพราะการ์ดถูกดึงออกจากหลังซอง — z-20 ให้ตัวซองบังการ์ดที่ยังอยู่ข้างใน */}
          {(phase === "ready" || phase === "tearing" || phase === "reveal" || phase === "empty") && (
            <div
              role={phase === "ready" ? "button" : undefined}
              tabIndex={phase === "ready" ? 0 : -1}
              aria-label="ฉีกซอง"
              onPointerDown={(e) => director.current?.packDown(e)}
              onPointerMove={(e) => director.current?.packMove(e)}
              onPointerUp={() => director.current?.packUp()}
              onPointerCancel={() => director.current?.packUp()}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                director.current?.tear(0);
              }}
              className={cn(
                "relative z-20 col-start-1 row-start-1 touch-none rounded-xl outline-none [perspective:900px] focus-visible:ring-[3px] focus-visible:ring-ring",
                // ฉีกแล้วซองไม่ใช่ปุ่มอีกต่อไป — เอาวง focus ที่ค้างจากการกด Enter ออก
                phase !== "ready" && "pointer-events-none focus-visible:ring-0",
              )}
            >
              <BoosterPack canteen={canteen} locked={phase === "empty"} />
            </div>
          )}

          {/* gallery: การ์ดใหญ่ด้านบน เว้นที่ด้านล่างให้แถวรูปย่อ (ซึ่งคือ .deal-card ที่ย่อลงไป) */}
          {(phase === "choose" || phase === "saved") && picked && (
            <div className="pointer-events-none absolute inset-x-0 top-2 grid place-items-center" style={{ bottom: THUMB_ROW_H }}>
              <PreviewCard key={picked.id} menu={picked} />
            </div>
          )}

          {/* render เสมอในเฟสนี้ (tween ไม่ต้องเช็คว่ามีไหม) แต่จะเรืองก็ต่อเมื่อมี Rare ซ่อนอยู่ใต้ใบบน */}
          {phase === "reveal" && (
            <div className="stack-tell pointer-events-none col-start-1 row-start-1 aspect-[5/7] w-[min(62vw,250px)] scale-[1.05] rounded-[7%/5%] bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500)_50%,var(--gold-300))] opacity-0 shadow-[0_0_40px_12px_var(--gold-500)]" />
          )}

          {phase !== "empty" && cards.map((m, i) => <DealCard key={m.id} menu={m} index={i} onSelect={() => director.current?.choose(i)} />)}

          <p className="rare-label pointer-events-none absolute top-[6%] font-heading text-5xl font-bold text-gold-300 opacity-0 drop-shadow-[0_0_18px_var(--gold-500)]" aria-hidden />
          <p className="stamp pointer-events-none absolute bottom-[8%] rounded-xl border-4 border-primary bg-stage-deep/80 px-4 py-1 font-heading text-2xl font-bold text-primary opacity-0">
            เก็บเข้าคอลเลกชันแล้ว
          </p>
        </div>

        {/* ---------- ส่วนล่าง: คำแนะนำ/ปุ่มตามเฟส ---------- */}
        <footer className="stage-chrome shrink-0 pt-3" aria-live="polite">
          {phase === "ready" && <Hint>แตะซอง หรือลากนิ้วผ่านซองเพื่อฉีก</Hint>}
          {phase === "reveal" && (
            <Hint key={cur}>
              <span className="mr-2 text-stage-fg-soft">ใบที่ {cur + 1}/3</span>
              {cur < cards.length - 1 ? "ปัดการ์ดไปซ้ายหรือขวาเพื่อดูใบถัดไป" : "ใบสุดท้าย! เดี๋ยวไปเลือกใบที่จะกินกัน"}
            </Hint>
          )}
          {phase === "choose" && (
            <div className="rise grid gap-3">
              <Hint>แตะการ์ดใบเล็กเพื่อดู แล้วเลือก 1 ใบที่จะไปกิน</Hint>
              <Button className="h-12 text-lg" disabled={selected === null} onClick={() => director.current?.save()}>
                ไปกินใบนี้
              </Button>
            </div>
          )}
          {phase === "saved" && picked && (
            <div className="grid gap-3">
              <p className="saved-action text-center text-lg">
                <span className="font-heading font-bold">{picked.name}</span>
                <span className="text-stage-fg-soft">
                  {" "}
                  · {getShop(picked.shopId)?.name} · {picked.price} บาท
                </span>
              </p>
              <div className="saved-action">
                <CardShareButtons menu={picked} tone="dark" />
              </div>
              <div className="saved-action grid grid-cols-2 gap-3">
                <Link
                  href="/collection"
                  className={cn(buttonVariants({ variant: "ghost" }), "h-12 bg-white/10 text-base text-stage-fg hover:bg-white/15 hover:text-stage-fg")}
                >
                  <LibraryBig data-icon="inline-start" />
                  คอลเลกชัน
                </Link>
                {packsLeft > 0 ? (
                  <Button className="h-12 text-base" onClick={onNext}>
                    <RotateCcw data-icon="inline-start" />
                    เปิดอีกซอง ({packsLeft})
                  </Button>
                ) : (
                  <p className="grid h-12 place-items-center rounded-full bg-white/5 text-center text-sm text-stage-fg-soft">
                    <span>
                      ซองถัดไปในอีก <NextPackCountdown />
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
          {phase === "empty" && (
            <div className="rise grid gap-3 text-center">
              <p className="font-heading text-2xl font-bold">ซองมื้อนี้หมดแล้ว</p>
              <p className="text-lg text-stage-fg-soft">
                ซองถัดไปมาในอีก <NextPackCountdown className="font-bold text-stage-fg" />
              </p>
              <Link href="/collection" className={cn(buttonVariants(), "h-12 text-base")}>
                ดูคอลเลกชันระหว่างรอ
              </Link>
            </div>
          )}
          {/* ปุ่มเติมซองไว้ทดสอบ — เปิดทุก environment ในช่วง staging (เอาออกก่อนเปิดใช้จริง) */}
          {(phase === "empty" || phase === "saved") && (
            <button
              type="button"
              onClick={() => {
                useStore.getState().resetPacks();
                onNext();
              }}
              className="mx-auto mt-2 block min-h-11 rounded-full px-3 text-sm text-stage-fg-soft underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              [dev] รีเซ็ตซองแล้วเปิดใหม่
            </button>
          )}
        </footer>
      </div>

      <div ref={fxLayer} className="pointer-events-none absolute inset-0 z-40 overflow-hidden [perspective:600px]" />
      <div className="flash pointer-events-none absolute inset-0 z-50 bg-white opacity-0" />
    </div>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="rise text-center text-lg text-stage-fg">{children}</p>;
}

function NextPackCountdown({ className }: { className?: string }) {
  const [ms, setMs] = useState(() => msUntilNextSlot());
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextSlot()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className={cn("tabular-nums", className)}>{formatCountdown(ms)}</span>;
}
