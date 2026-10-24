"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useStore } from "@/lib/store";

// mock: answers are stored but not used for filtering yet
const QUESTIONS = [
  { id: "budget", q: "งบวันนี้เท่าไหร่?", emoji: "💸", options: ["ไม่เกิน 40", "40–60", "จัดเต็ม!"] },
  { id: "spicy", q: "กินเผ็ดได้แค่ไหน?", emoji: "🌶️", options: ["ไม่เผ็ดเลย", "นิดหน่อย", "เผ็ดมาก 🔥"] },
  { id: "base", q: "อยากกินอะไร?", emoji: "🍜", options: ["ข้าว", "เส้น", "อะไรก็ได้"] },
  { id: "hunger", q: "หิวแค่ไหน?", emoji: "😋", options: ["หิวนิดหน่อย", "หิวมากกก"] },
];

const OPTION_BG = ["bg-sun", "bg-aqua", "bg-pink-soft", "bg-mint"];

export function Quiz({ canteenId }: { canteenId: string }) {
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const setAnswer = useStore((s) => s.setAnswer);
  const [step, setStep] = useState(0);
  const q = QUESTIONS[step];

  // each new question slides in
  useGSAP(
    () => {
      gsap.from(".q-emoji", { scale: 0, rotation: -40, duration: 0.5, ease: "back.out(2.5)" });
      gsap.from(".q-title", { y: 20, opacity: 0, duration: 0.4 });
      gsap.from(".q-opt", { x: 60, opacity: 0, stagger: 0.07, duration: 0.45, ease: "back.out(1.6)" });
    },
    { scope: root, dependencies: [step] },
  );

  const { contextSafe } = useGSAP({ scope: root });

  const choose = contextSafe((a: string, el: HTMLElement) => {
    setAnswer(q.id, a);
    gsap
      .timeline({
        onComplete: () => {
          if (step + 1 < QUESTIONS.length) setStep(step + 1);
          else router.push(`/${canteenId}/open`);
        },
      })
      .to(el, { scale: 1.06, duration: 0.12 })
      .to(".q-opt", { x: -60, opacity: 0, stagger: 0.04, duration: 0.25, ease: "power2.in" });
  });

  return (
    <main ref={root} className="flex flex-1 flex-col px-5 pb-10">
      <div className="mt-3 flex gap-2">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`h-3 flex-1 rounded-full border-2 border-ink ${i <= step ? "bg-pink" : "bg-white"}`} />
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <span className="q-emoji grid h-16 w-16 place-items-center rounded-2xl border-[2.5px] border-ink bg-white text-4xl shadow-[3px_3px_0_0_var(--ink)]">
          {q.emoji}
        </span>
        <span className="font-display text-sm font-semibold text-ink/60">
          ข้อ {step + 1} / {QUESTIONS.length}
        </span>
      </div>
      <h1 key={q.id} className="q-title title-pop mt-4 text-[2.1rem]">
        {q.q}
      </h1>

      <div className="mt-7 grid gap-3">
        {q.options.map((o, i) => (
          <button
            key={`${q.id}-${o}`}
            onClick={(e) => choose(o, e.currentTarget)}
            className={`q-opt btn !justify-start !rounded-2xl !py-4 !text-lg ${OPTION_BG[i % OPTION_BG.length]}`}
          >
            {o}
          </button>
        ))}
      </div>

      <button
        onClick={() => router.push(`/${canteenId}/open`)}
        className="mt-auto pt-10 text-center text-sm text-ink/60 underline decoration-pink decoration-2 underline-offset-4"
      >
        ข้ามไปเปิดซองเลย →
      </button>
    </main>
  );
}
