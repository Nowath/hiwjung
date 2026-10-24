"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** Children marked with data-pop bounce in one after another when the block mounts. */
export function PopIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.from("[data-pop]", {
        y: 36,
        opacity: 0,
        rotation: () => gsap.utils.random(-4, 4),
        duration: 0.6,
        stagger: 0.07,
        delay,
        ease: "back.out(1.7)",
        clearProps: "transform",
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Endless ticker band, Partake-style. */
export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.to(".marquee-track", { xPercent: -50, duration: 18, ease: "none", repeat: -1 });
    },
    { scope: ref },
  );
  const row = [...items, ...items];
  return (
    <div ref={ref} className={`overflow-hidden border-y-[2.5px] border-ink ${className}`}>
      <div className="marquee-track flex w-max">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0">
            {row.map((t, i) => (
              <span key={i} className="font-display flex items-center gap-4 px-4 py-2 text-sm font-semibold whitespace-nowrap">
                {t}
                <span aria-hidden>✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
