"use client";

// GSAP contextSafe() wraps handlers without calling them, but the React Compiler
// lint assumes it may read refs during render.
/* eslint-disable react-hooks/refs */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { CardBack, FoodCard } from "@/components/FoodCard";
import { CardShareButtons } from "@/components/CardActions";
import { drawPack } from "@/lib/pack";
import { currentSlot, formatCountdown, msUntilNextSlot } from "@/lib/meal";
import { useHydrated, usePacksLeft, useStore } from "@/lib/store";
import { getShop } from "@/lib/data";
import type { Canteen, Menu } from "@/lib/types";

gsap.registerPlugin(useGSAP);

type Phase = "pack" | "reveal" | "choose" | "done";

/**
 * Pack opening flow, modelled on Pokémon TCG Pocket:
 * pack floats → drag across the tear line (or tap) → top flies off with a flash →
 * a face-down stack rises → tap to flip one by one (rares last, with shake + glow) →
 * swipe away → pick 1 of 3 → saved to collection.
 */
export function PackFlow({ canteen }: { canteen: Canteen }) {
  const hydrated = useHydrated();
  const [round, setRound] = useState(0);
  if (!hydrated) return <div className="flex-1" />;
  return <PackOpener key={round} canteen={canteen} onAgain={() => setRound((r) => r + 1)} />;
}

function PackOpener({ canteen, onAgain }: { canteen: Canteen; onAgain: () => void }) {
  const left = usePacksLeft();
  const addCard = useStore((s) => s.addCard);
  const [phase, setPhase] = useState<Phase>("pack");
  const [cards, setCards] = useState<Menu[]>([]);
  const [chosen, setChosen] = useState<Menu | null>(null);
  // checked once on mount: the counter drops to 0 mid-animation when the last pack is torn
  const [outOfPacks] = useState(() => left <= 0);

  if (outOfPacks) return <OutOfPacks />;

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      {phase === "pack" && (
        <PackStage
          canteen={canteen}
          onOpened={(c) => {
            setCards(c);
            setPhase("reveal");
          }}
        />
      )}
      {phase === "reveal" && <RevealStage cards={cards} onDone={() => setPhase("choose")} />}
      {phase === "choose" && (
        <ChooseStage
          cards={cards}
          onChoose={(m) => {
            addCard(m.id);
            setChosen(m);
            setPhase("done");
          }}
        />
      )}
      {phase === "done" && chosen && <DoneStage menu={chosen} packsLeft={left} onAgain={onAgain} />}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Pack                                                              */
/* ------------------------------------------------------------------ */

const PACK_W = 230;
const PACK_H = 360;
const TOP_H = 56;

function PackStage({ canteen, onOpened }: { canteen: Canteen; onOpened: (cards: Menu[]) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, active: false, moved: 0, done: false });
  const consumePack = useStore((s) => s.consumePack);
  const slot = currentSlot();

  const { contextSafe } = useGSAP(
    () => {
      gsap.set(".tear-progress", { scaleX: 0 });
      gsap.from(".pack", { y: 320, rotation: -12, opacity: 0, duration: 1, ease: "back.out(1.3)" });
      gsap.from(".rays", { scale: 0, opacity: 0, duration: 1.2, ease: "power3.out", delay: 0.3 });
      gsap.from(".sticker", { scale: 0, rotation: -90, stagger: 0.08, delay: 0.6, duration: 0.5, ease: "back.out(2.5)" });
      // idle float + gentle sway, then a little "pick me" wiggle every few seconds
      gsap.to(".pack-float", { y: -12, rotation: 1.5, duration: 1.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap
        .timeline({ repeat: -1, repeatDelay: 2.6, delay: 2.2, id: "wiggle" })
        .to(".pack", { rotation: 4, duration: 0.08 })
        .to(".pack", { rotation: -4, duration: 0.08, repeat: 3, yoyo: true })
        .to(".pack", { rotation: 0, duration: 0.12 });
      gsap.to(".pack-hint", { y: -4, repeat: -1, yoyo: true, duration: 0.7, ease: "sine.inOut" });
      gsap.to(".tear-line", { opacity: 0.3, repeat: -1, yoyo: true, duration: 0.6 });
    },
    { scope: root },
  );

  const tear = contextSafe(() => {
    if (drag.current.done) return;
    drag.current.done = true;
    if (!consumePack()) return;
    const cards = drawPack(canteen.id);
    gsap.getById("wiggle")?.kill();
    gsap.killTweensOf([".pack-hint", ".tear-line", ".pack-float", ".pack"]);
    gsap.set(".pack", { rotation: 0 });
    gsap.to([".pack-hint", ".tear-line", ".sticker"], { opacity: 0, scale: 0.6, duration: 0.2 });
    gsap.to(".rays", { scale: 1.6, duration: 1.2, ease: "power2.out" });

    gsap
      .timeline({ onComplete: () => onOpened(cards) })
      .to(".tear-progress", { scaleX: 1, duration: 0.2, ease: "power1.in" })
      .to(".pack", { x: "+=5", duration: 0.04, repeat: 9, yoyo: true, ease: "none" })
      .to(".pack-top", { x: 200, y: -180, rotation: 45, opacity: 0, duration: 0.7, ease: "power2.in" }, ">-0.05")
      .fromTo(".pack-flash", { scale: 0, opacity: 1 }, { scale: 5, opacity: 0, duration: 0.9, ease: "power2.out" }, "<")
      .to(".tear-progress", { opacity: 0, duration: 0.2 }, "<")
      .to(".pack-body", { y: 140, scale: 0.95, duration: 0.35, ease: "power2.out" }, "-=0.45")
      .to(".pack-body", { y: 520, opacity: 0, duration: 0.45, ease: "power2.in" });
  });

  const onDown = (e: React.PointerEvent) => {
    if (drag.current.done) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { ...drag.current, startX: e.clientX, active: true, moved: 0 };
  };

  const onMove = contextSafe((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active || d.done) return;
    const dx = Math.abs(e.clientX - d.startX);
    d.moved = Math.max(d.moved, dx);
    const p = Math.min(1, dx / (PACK_W * 0.75));
    gsap.set(".tear-progress", { scaleX: p });
    if (p >= 1) {
      d.active = false;
      tear();
    }
  });

  const onUp = contextSafe(() => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.moved < 10) tear(); // a tap opens it too
    else gsap.to(".tear-progress", { scaleX: 0, duration: 0.3, ease: "power2.out" });
  });

  return (
    <div ref={root} className="relative isolate flex flex-1 flex-col items-center justify-center">
      <div className="rays pointer-events-none absolute left-1/2 top-1/2 -z-10 -ml-[300px] -mt-[300px] h-[600px] w-[600px]" />
      <div className="pack-flash pointer-events-none absolute left-1/2 top-1/2 z-20 -ml-24 -mt-24 h-48 w-48 rounded-full bg-[radial-gradient(circle,#fff_0%,#ffe7b0_35%,transparent_70%)] opacity-0" />

      <p className="font-display mb-6 -rotate-2 rounded-full border-2 border-ink bg-white px-3 py-0.5 text-sm font-semibold">
        📍 {canteen.name}
      </p>

      <div className="pack-float relative">
        <div
          className="pack relative cursor-grab touch-none select-none active:cursor-grabbing"
          style={{ width: PACK_W, height: PACK_H, filter: "drop-shadow(6px 6px 0 var(--ink))" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {/* crimped top that gets torn off */}
          <div
            className="pack-top absolute inset-x-0 top-0 rounded-t-2xl border-[3px] border-b-0 border-ink bg-pink"
            style={{ height: TOP_H }}
          >
            <div className="pack-crimp absolute inset-x-0 top-0 h-3.5 rounded-t-2xl" />
            <div className="font-display absolute inset-x-0 bottom-2 text-center text-sm font-semibold text-white">
              ✂ ฉีกตรงนี้
            </div>
          </div>

          <div
            className="pack-body pack-art absolute inset-x-0 bottom-0 flex flex-col items-center justify-center overflow-hidden rounded-b-2xl border-[3px] border-t-0 border-ink text-center"
            style={{ top: TOP_H }}
          >
            <div className="pack-crimp absolute inset-x-0 bottom-0 h-3.5" />
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border-[3px] border-ink bg-white text-5xl">
              {canteen.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={canteen.image} alt="" className="h-full w-full object-cover" draggable={false} />
              ) : (
                "🍛"
              )}
            </div>
            <div className="font-display mt-3 -rotate-3 rounded-2xl border-[3px] border-ink bg-white px-4 py-1 text-[2.1rem] leading-tight font-bold shadow-[4px_4px_0_0_var(--ink)]">
              กินไรดี
            </div>
            <div className="font-display mt-3 rounded-full border-2 border-ink bg-pink px-3 py-0.5 text-sm font-semibold text-white">
              ซอง{slot.label}
            </div>
            <div className="font-display mt-2 text-xs font-semibold tracking-widest">{canteen.short} · 3 การ์ด</div>
          </div>

          {/* tear guide + progress */}
          <div className="tear-line pointer-events-none absolute inset-x-1 h-[2.5px]" style={{ top: TOP_H - 1 }} />
          <div
            className="tear-progress pointer-events-none absolute inset-x-0 h-[6px] origin-left rounded-full bg-white shadow-[0_0_10px_4px_var(--sun)]"
            style={{ top: TOP_H - 3 }}
          />
        </div>

        {/* floating stickers around the pack */}
        <span className="sticker pointer-events-none absolute -top-5 -left-8 text-4xl">🌶️</span>
        <span className="sticker pointer-events-none absolute top-1/3 -right-12 rotate-12 text-4xl">🍳</span>
        <span className="sticker pointer-events-none absolute -bottom-6 -left-10 -rotate-12 text-4xl">🍜</span>
      </div>

      <p className="pack-hint font-display mt-12 rounded-2xl border-2 border-ink bg-white px-4 py-2 text-center text-sm font-semibold shadow-[3px_3px_0_0_var(--ink)]">
        👆 ลากนิ้วผ่านเส้นประเพื่อฉีก
        <span className="block text-xs font-medium text-ink/60">หรือแตะเพื่อเปิดเลยก็ได้</span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Reveal stack                                                      */
/* ------------------------------------------------------------------ */

const CONFETTI = ["#e4528c", "#3fb6e8", "#ffc83d", "#c8ebc4"];
const GOLD_CONFETTI = ["#ffc83d", "#ffe7b0", "#e4528c"];

/** Confetti pieces with an ink outline that pop out, spin and fall a little. */
function burst(container: HTMLElement, colors: string[], count = 22) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    const size = 7 + Math.random() * 8;
    Object.assign(p.style, {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: `${size}px`,
      height: `${size * (Math.random() < 0.5 ? 1 : 0.5)}px`,
      borderRadius: Math.random() < 0.4 ? "9999px" : "2px",
      background: colors[i % colors.length],
      border: "1.5px solid #17357a",
      pointerEvents: "none",
    });
    container.appendChild(p);
    const a = Math.random() * Math.PI * 2;
    const r = 110 + Math.random() * 150;
    gsap
      .timeline({ onComplete: () => p.remove() })
      .fromTo(
        p,
        { x: 0, y: 0, scale: 0.4, rotation: 0 },
        { x: Math.cos(a) * r, y: Math.sin(a) * r, scale: 1, rotation: gsap.utils.random(-360, 360), duration: 0.7, ease: "power3.out" },
      )
      .to(p, { y: "+=60", opacity: 0, rotation: "+=90", duration: 0.6, ease: "power1.in" });
  }
}

function RevealStage({ cards, onDone }: { cards: Menu[]; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const busy = useRef(true);
  const drag = useRef({ startX: 0, dx: 0, active: false });
  const current = cards[index];
  const isLast = index === cards.length - 1;

  // stack rises out of the torn pack
  useGSAP(
    () => {
      const els = cardEls.current.filter(Boolean);
      gsap.set(".flip-inner", { transformPerspective: 1000 });
      gsap.fromTo(
        els,
        { y: 500, opacity: 0, rotation: () => gsap.utils.random(-8, 8) },
        {
          y: (i) => i * 22,
          scale: (i) => 1 - i * 0.04,
          rotation: 0,
          opacity: 1,
          duration: 0.7,
          stagger: { each: 0.08, from: "end" },
          ease: "back.out(1.2)",
          onComplete: () => {
            busy.current = false;
          },
        },
      );
    },
    { scope: root },
  );

  // restack + rare "hint" glow whenever a new card comes on top
  useGSAP(
    () => {
      if (index === 0) return;
      cardEls.current.forEach((el, j) => {
        if (!el || j < index) return;
        gsap.to(el, { y: (j - index) * 22, scale: 1 - (j - index) * 0.04, duration: 0.35, ease: "power2.out" });
      });
    },
    { scope: root, dependencies: [index] },
  );

  useGSAP(
    () => {
      gsap.killTweensOf(".rare-aura");
      if (current?.rarity === "rare" && !flipped) {
        // TCG Pocket teases a rare before you see it: pulsing gold aura behind the back
        gsap.fromTo(".rare-aura", { opacity: 0.15, scale: 0.9 }, { opacity: 0.55, scale: 1.05, duration: 0.7, repeat: -1, yoyo: true, ease: "sine.inOut" });
      } else if (!flipped) {
        gsap.to(".rare-aura", { opacity: 0, duration: 0.2 });
      }
    },
    { scope: root, dependencies: [index] },
  );

  const { contextSafe } = useGSAP({ scope: root });

  const flip = contextSafe(() => {
    const el = cardEls.current[index];
    if (!el || busy.current) return;
    busy.current = true;
    const inner = el.querySelector(".flip-inner");
    const rare = current.rarity === "rare";
    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false;
        setFlipped(true);
      },
    });

    if (rare) {
      gsap.killTweensOf(".rare-aura");
      tl.to(".rare-aura", { opacity: 1, scale: 1.35, duration: 0.35, ease: "power2.out" })
        .to(el, { rotation: 2.5, x: 3, duration: 0.045, repeat: 15, yoyo: true, ease: "none" }, "<")
        .to(el, { rotation: 0, x: 0, scale: 1.08, duration: 0.15 })
        .add(() => burst(root.current!.querySelector(".particles") as HTMLElement, GOLD_CONFETTI, 34))
        .to(inner, { rotateY: 180, duration: 0.7, ease: "back.out(1.8)" }, "<")
        .to(el, { scale: 1, duration: 0.4, ease: "power2.out" })
        .fromTo(".rays", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }, "<-0.4")
        .fromTo(".rare-label", { opacity: 0, scale: 0, rotation: -20 }, { opacity: 1, scale: 1, rotation: -6, duration: 0.45, ease: "back.out(3)" }, "<")
        .to(".rare-aura", { opacity: 0.5, scale: 1.1, duration: 0.5 }, "<");
    } else {
      tl.to(el, { y: -16, duration: 0.15, ease: "power1.out" })
        .to(inner, { rotateY: 180, duration: 0.5, ease: "back.out(1.6)" }, "<")
        .add(() => burst(root.current!.querySelector(".particles") as HTMLElement, CONFETTI, 14), "<0.15")
        .to(el, { y: 0, duration: 0.25, ease: "power2.in" });
    }
  });

  const dismiss = contextSafe((dir: 1 | -1) => {
    const el = cardEls.current[index];
    if (!el) return;
    busy.current = true;
    gsap.to([".rays", ".rare-label", ".rare-aura"], { opacity: 0, duration: 0.25 });
    if (isLast) {
      // last card stays; whole stack moves on to the "choose" screen
      gsap.to(el, { scale: 0.8, opacity: 0, duration: 0.35, ease: "power2.in", onComplete: onDone });
      return;
    }
    gsap.to(el, {
      x: dir * 520,
      y: -60,
      rotation: dir * 28,
      opacity: 0,
      duration: 0.45,
      ease: "power2.in",
      onComplete: () => {
        busy.current = false;
        setFlipped(false);
        setIndex((i) => i + 1);
      },
    });
  });

  const onDown = (e: React.PointerEvent) => {
    if (busy.current) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { startX: e.clientX, dx: 0, active: true };
  };

  const onMove = contextSafe((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active || !flipped) return;
    d.dx = e.clientX - d.startX;
    gsap.set(cardEls.current[index], { x: d.dx, rotation: d.dx / 14 });
  });

  const onUp = contextSafe(() => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (Math.abs(d.dx) < 8) {
      if (!flipped) flip();
      else dismiss(1);
    } else if (Math.abs(d.dx) > 90) {
      dismiss(d.dx > 0 ? 1 : -1);
    } else {
      gsap.to(cardEls.current[index], { x: 0, rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    }
  });

  const hint = !flipped
    ? "แตะเพื่อเปิดการ์ด"
    : isLast
      ? "แตะเพื่อไปเลือกการ์ด"
      : "ปัดหรือแตะเพื่อดูใบถัดไป";

  return (
    <div ref={root} className="relative isolate flex flex-1 flex-col items-center justify-center">
      <div className="mb-6 flex gap-2">
        {cards.map((_, j) => (
          <span
            key={j}
            className={`font-display grid h-8 w-8 place-items-center rounded-full border-2 border-ink text-sm font-bold transition-colors ${
              j < index || (j === index && flipped) ? "bg-pink text-white" : j === index ? "bg-sun" : "bg-white"
            }`}
          >
            {j + 1}
          </span>
        ))}
      </div>

      <div
        className="relative isolate touch-none select-none"
        style={{ width: "min(68vw, 260px)", aspectRatio: "5 / 7" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="rays rays--gold pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[260%] -translate-x-1/2 -translate-y-1/2 opacity-0" />
        <div className="rare-aura pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] opacity-0" />
        <div className="particles pointer-events-none absolute inset-0 z-50" />

        {cards.map((m, j) => (
          <div
            key={m.id}
            ref={(el) => {
              cardEls.current[j] = el;
            }}
            className="absolute inset-0"
            style={{ zIndex: cards.length - j }}
          >
            <div className="flip-inner card-3d h-full w-full">
              <div className="card-face shadow-[5px_5px_0_0_var(--ink)]">
                <CardBack className="text-[13px]" />
              </div>
              <div className="card-face card-face--front shadow-[5px_5px_0_0_var(--ink)]">
                <FoodCard menu={m} tilt={false} priority className="h-full w-full" />
              </div>
            </div>
          </div>
        ))}

        <div className="rare-label font-display pointer-events-none absolute -top-6 -right-8 z-[60] rounded-2xl border-[3px] border-ink bg-sun px-3 py-1 text-xl font-bold opacity-0 shadow-[4px_4px_0_0_var(--ink)]">
          ★ RARE!
        </div>
      </div>

      <div className="mt-14 h-16 text-center">
        {flipped && (
          <p className="font-display text-xl font-bold">
            {current.name} <span className="text-base font-medium text-ink/60">· {current.price}฿</span>
          </p>
        )}
        <p className="font-display mt-1 inline-block rounded-full border-2 border-ink bg-white px-3 py-0.5 text-sm font-semibold">
          {hint}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Choose one                                                        */
/* ------------------------------------------------------------------ */

function ChooseStage({ cards, onChoose }: { cards: Menu[]; onChoose: (m: Menu) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const picked = useRef(false);

  useGSAP(
    () => {
      gsap.from(".choice", { y: 140, opacity: 0, scale: 0.6, rotation: (i) => (i - 1) * 10, duration: 0.6, stagger: 0.1, ease: "back.out(1.4)" });
      gsap.from(".choose-title", { y: -20, opacity: 0, duration: 0.5 });
    },
    { scope: root },
  );

  const { contextSafe } = useGSAP({ scope: root });

  const pick = contextSafe((i: number) => {
    if (picked.current) return;
    picked.current = true;
    const els = gsap.utils.toArray<HTMLElement>(".choice");
    gsap.to(els.filter((_, j) => j !== i), { opacity: 0.15, scale: 0.85, y: 30, duration: 0.35 });
    gsap.to(els[i], { scale: 1.12, y: -16, duration: 0.35, ease: "back.out(2)" });
    gsap.delayedCall(0.55, () => onChoose(cards[i]));
  });

  return (
    <div ref={root} className="flex flex-1 flex-col items-center justify-center px-4">
      <h2 className="choose-title title-pop text-[2rem]">
        เลือก<span className="text-pink">1 ใบ</span>ไปกิน!
      </h2>
      <p className="choose-title mb-8 text-sm text-ink/70">ใบที่เลือกจะเก็บเข้าสมุดการ์ด</p>
      <div className="grid w-full grid-cols-3 gap-3">
        {cards.map((m, i) => (
          <button key={m.id} className="choice text-left" onClick={() => pick(i)}>
            <FoodCard menu={m} tilt={false} />
            <p className="font-display mt-3 truncate text-center text-sm font-semibold">{m.name}</p>
            <p className="text-center text-[11px] text-ink/60">
              {getShop(m.shopId)?.name} · {m.price}฿
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Saved                                                             */
/* ------------------------------------------------------------------ */

function DoneStage({ menu, packsLeft, onAgain }: { menu: Menu; packsLeft: number; onAgain: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const count = useStore((s) => s.collection[menu.id]?.count ?? 1);
  const rare = menu.rarity === "rare";

  useGSAP(
    () => {
      gsap
        .timeline()
        .from(".done-card", { scale: 0.3, y: 160, rotation: -14, opacity: 0, duration: 0.8, ease: "back.out(1.5)" })
        .fromTo(".rays", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.6 }, "<0.2")
        .add(() => burst(root.current!.querySelector(".particles") as HTMLElement, rare ? GOLD_CONFETTI : CONFETTI, 30), "<")
        .from(".done-ui", { y: 24, opacity: 0, stagger: 0.08, duration: 0.4 }, "-=0.3");
    },
    { scope: root },
  );

  return (
    <div ref={root} className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
      <p className="done-ui font-display mb-5 -rotate-2 rounded-full border-2 border-ink bg-mint px-4 py-1 text-sm font-semibold">
        ✓ เก็บเข้าสมุดการ์ดแล้ว{count > 1 && <b className="text-pink"> (x{count})</b>}
      </p>
      <div className="relative isolate w-[min(64vw,240px)]">
        <div className={`rays ${rare ? "rays--gold" : ""} pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2`} />
        <div className="particles pointer-events-none absolute inset-0 z-50" />
        <div className="done-card">
          <FoodCard menu={menu} priority />
        </div>
      </div>
      <h2 className="done-ui title-pop mt-7 text-center text-[1.9rem]">
        ไปกิน<span className="text-pink">{menu.name}</span>กัน!
      </h2>
      <p className="done-ui mb-5 text-sm text-ink/70">
        {getShop(menu.shopId)?.name} · {menu.price}฿
      </p>

      <div className="done-ui w-full">
        <CardShareButtons menu={menu} />
      </div>
      <div className="done-ui mt-1 grid w-full grid-cols-2 gap-3">
        <Link href="/collection" className="btn bg-sky text-sm text-white">
          สมุดการ์ด
        </Link>
        {packsLeft > 0 ? (
          <button onClick={onAgain} className="btn bg-sun text-sm">
            เปิดซองต่อ ({packsLeft})
          </button>
        ) : (
          <Link href="/" className="btn bg-white text-sm opacity-70">
            ซองหมดแล้ว
          </Link>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function OutOfPacks() {
  const [ms, setMs] = useState(() => msUntilNextSlot());
  useEffect(() => {
    const t = setInterval(() => setMs(msUntilNextSlot()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="grid h-24 w-24 place-items-center rounded-full border-[3px] border-ink bg-butter text-5xl shadow-[4px_4px_0_0_var(--ink)]">
        😴
      </div>
      <h2 className="title-pop mt-3 text-[1.9rem]">
        ซอง{currentSlot().label}<span className="text-pink">หมดแล้ว</span>
      </h2>
      <p className="text-ink/70">ซองใหม่มาในอีก</p>
      <p className="pop-box font-display bg-white px-5 py-2 text-4xl font-bold tabular-nums">{formatCountdown(ms)}</p>
      <Link href="/collection" className="btn mt-6 bg-sky text-white">
        ไปดูสมุดการ์ดระหว่างรอ
      </Link>
    </main>
  );
}
