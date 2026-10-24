"use client";

// GSAP contextSafe() wraps handlers without calling them, but the React Compiler
// lint assumes it may read refs during render.
/* eslint-disable react-hooks/refs */

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { Menu } from "@/lib/types";

/**
 * Card image + rarity effect layer. Rare cards get a holo foil + glare that
 * follow the pointer, and the whole card tilts in 3D.
 */
export function FoodCard({
  menu,
  tilt = true,
  className = "",
  priority = false,
}: {
  menu: Menu;
  tilt?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rare = menu.rarity === "rare";

  const { contextSafe } = useGSAP(
    () => {
      gsap.set(ref.current, { transformPerspective: 800 });
      // rare cards gently sway on their own so the foil is visible without touching
      if (rare && ref.current) {
        gsap.fromTo(
          ref.current,
          { "--mx": "20%", "--my": "30%" },
          { "--mx": "80%", "--my": "70%", duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 },
        );
      }
    },
    { scope: ref, dependencies: [rare] },
  );

  const onMove = contextSafe((e: React.PointerEvent<HTMLDivElement>) => {
    if (!tilt || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    gsap.killTweensOf(ref.current);
    gsap.to(ref.current, {
      rotateY: (px - 0.5) * 22,
      rotateX: (0.5 - py) * 22,
      "--mx": `${px * 100}%`,
      "--my": `${py * 100}%`,
      "--o": 0.9,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  const onLeave = contextSafe(() => {
    if (!ref.current) return;
    gsap.to(ref.current, {
      rotateX: 0,
      rotateY: 0,
      "--o": 0.55,
      duration: 0.8,
      ease: "elastic.out(1, 0.5)",
    });
  });

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`card-3d holo select-none ${
        rare
          ? "shadow-[0_0_0_3px_var(--sun),5px_5px_0_3px_var(--ink)]"
          : "shadow-[0_0_0_2px_var(--ink),4px_4px_0_2px_var(--ink)]"
      } ${className}`}
    >
      <div className="card-face">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={menu.image}
          alt={menu.name}
          draggable={false}
          loading={priority ? "eager" : "lazy"}
          className="h-full w-full object-cover"
        />
        {rare && (
          <>
            <div className="holo-shine" />
            <div className="holo-glare" />
          </>
        )}
      </div>
    </div>
  );
}

export function CardBack({ className = "" }: { className?: string }) {
  return (
    <div className={`card-back h-full w-full ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <div className="grid h-[4.5em] w-[4.5em] place-items-center rounded-full border-[3px] border-ink bg-sun text-[2em] shadow-[3px_3px_0_0_var(--ink)]">
          🍛
        </div>
        <div className="font-display rotate-[-4deg] rounded-xl border-[3px] border-ink bg-white px-3 py-0.5 text-[1.6em] font-bold text-ink shadow-[3px_3px_0_0_var(--ink)]">
          กินไรดี
        </div>
        <div className="font-display text-[0.75em] font-semibold tracking-[0.25em] text-white">CU CANTEEN</div>
      </div>
    </div>
  );
}
