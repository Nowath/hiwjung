import type { PointerEvent as ReactPointerEvent } from "react";
import type { Menu } from "@/lib/types";
import { useStore } from "@/lib/store";
import { sfx, unlockAudio } from "./sfx";
import { ambientSparkles, burst, centerIn, converge, Draggable, gsap, GOLD, PINK, prefersReducedMotion, shake } from "./fx";

export type Phase = "ready" | "tearing" | "reveal" | "choose" | "saved" | "empty";

type Safe = <T extends (...args: never[]) => unknown>(fn: T) => T;

type Deps = {
  root: HTMLElement;
  table: HTMLElement;
  fx: HTMLElement;
  sparkles: HTMLElement;
  cards: Menu[];
  phase: Phase;
  safe: Safe;
  setPhase: (p: Phase) => void;
  setSelected: (i: number) => void;
  setCur: (i: number) => void;
};

export type Director = ReturnType<typeof createDirector>;

const q = (el: Element, sel: string) => el.querySelector(sel)!;

// กองซ้อนตรงกันพอดี — มองไม่เห็นใบถัดไปจนกว่าจะแง้ม/ปัดใบบนออก (2D ล้วน ไม่มีแกน Z)
const STACK = { x: 0, y: 0, rotation: 0, scale: 1 };
/** ลากเกินเท่านี้ (px) แล้วปล่อย = ปัดทิ้งไปใบถัดไป */
const SWIPE_OUT = 90;
/** ใบสุดท้ายเฉลยเสร็จแล้วค้างให้ดูเท่านี้ (วินาที) ก่อนเข้า gallery เอง */
const LAST_HOLD = 1;

/** ความกว้างรูปย่อในแถวล่างของ gallery (px) — pack-stage ใช้กันที่ไว้ให้แถวนี้ */
export const THUMB_W = 72;
/** ยกแถวรูปย่อขึ้นจากขอบล่างของโต๊ะเท่านี้ (px) ให้ห่างข้อความ/ปุ่มด้านล่าง */
const THUMB_LIFT = 36;
export const THUMB_ROW_H = Math.round(THUMB_W * 1.4) + THUMB_LIFT + 20;

/**
 * ผู้กำกับฉากเปิดซอง — สร้างครั้งเดียวใน useGSAP (ช่วง effect ไม่ใช่ render)
 * ทุก timeline/handler ห่อด้วย safe ให้อยู่ใน gsap.context เดียวกัน → unmount แล้ว revert หมด
 * สถานะสดเก็บใน closure นี้ ส่วน React state มีไว้แค่เปลี่ยนข้อความ/ปุ่มใน UI
 */
export function createDirector(d: Deps) {
  const { root, table, fx, cards, safe } = d;
  const reduced = prefersReducedMotion();
  const s = { phase: d.phase as Phase | "spreading", selected: -1, cur: 0, busy: false, drags: [] as Draggable[], autoGallery: null as gsap.core.Tween | null };
  const els = () => gsap.utils.toArray<HTMLElement>(".deal-card", root);
  const go = (p: Phase) => {
    s.phase = p;
    d.setPhase(p);
  };
  const speed = (tl: gsap.core.Timeline) => (reduced ? tl.timeScale(4) : tl);

  // ---------- เอียงซองตามนิ้ว/เมาส์ (เฉพาะตอนรอฉีก) — ไม่ใช้ไจโรแล้วเพราะ Android ยิง event ถี่จนกระตุก ----------
  let packTilt: { rx: gsap.QuickToFunc; ry: gsap.QuickToFunc } | null = null;
  let packIdle = false;
  const aim = (nx: number, ny: number) => {
    // รอให้ท่าอัญเชิญซองจบก่อน ไม่งั้น quickTo แย่ง rotation กับ tween เข้าฉาก
    if (s.phase !== "ready" || reduced || !packIdle) return;
    const t = root.querySelector(".pack-tilt");
    if (!t) return;
    packTilt ??= { rx: gsap.quickTo(t, "rotationX", { duration: 0.5, ease: "power3" }), ry: gsap.quickTo(t, "rotationY", { duration: 0.5, ease: "power3" }) };
    packTilt.rx(-ny * 24);
    packTilt.ry(nx * 30);
    // ฟอยล์รุ้งเลื่อนสวนมุมเอียง ให้เหมือนแสงสะท้อนบนซองจริง
    const foil = root.querySelector(".pack-foil");
    if (foil) {
      gsap.killTweensOf(foil);
      gsap.set(foil, { "--mx": `${50 - nx * 90}%`, "--my": `${50 - ny * 90}%` });
    }
  };
  const onPointer = (e: PointerEvent) => aim(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);

  // ---------- intro: ฉากหลัง + ซองตกลงมา ----------
  function intro() {
    const cleanSparkles = ambientSparkles(d.sparkles);
    gsap.set([".rays", ".rays-gold"], { xPercent: -50, yPercent: -50 });
    gsap.to(".rays", { rotation: 360, duration: 70, repeat: -1, ease: "none" });
    gsap.to(".rays-gold", { rotation: -360, duration: 45, repeat: -1, ease: "none" });
    gsap.fromTo(".stage-glow", { scale: 0.9, opacity: 0.45 }, { scale: 1.15, opacity: 0.8, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.from(".stage-chrome", { opacity: 0, y: (i: number) => (i ? 24 : -24), duration: 0.7, delay: 0.3, ease: "power3.out" });

    window.addEventListener("pointermove", onPointer);

    const tl = gsap.timeline();
    tl.from(".rays", { opacity: 0, scale: 0.5, duration: 1.4, ease: "power2.out" }, 0);
    if (s.phase === "empty") {
      tl.from(".pack", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, 0.1);
      gsap.to(".pack", { y: -8, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.9 });
    } else {
      // อัญเชิญซอง: ประกายรอบจอดูดเข้ากลาง → วงแสงแตก → ซองปรากฏจากความเบลอ ลอยขึ้นพร้อมเอียง 3D แล้วตั้งตรง
      // หมุน Y ไม่เกิน ~40° เพื่อไม่ให้เห็นหลังซองที่กลับด้าน
      // จุดรวมแสง = กลางโต๊ะ (วงกระแทก .shock) — วัดจาก .pack ไม่ได้เพราะ fromTo วางซองไว้ที่จุดเริ่ม (y: 140) ทันที
      const packCenter = () => centerIn(fx, root.querySelector(".shock")!);
      gsap.set(".pack", { opacity: 0 });
      tl.add(() => converge(fx, { ...packCenter(), count: 46, colors: [...PINK, "var(--gold-300)"], radius: Math.min(window.innerWidth, 420) * 0.75, duration: 0.9 }), 0.1)
        .fromTo(".pack-glow", { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 0.9, duration: 1, ease: "power2.in" }, 0.15)
        .addLabel("pop", 1.05)
        // immediateRender: false — ไม่งั้นวงกระแทกโผล่ค้างตั้งแต่ต้นก่อนถึงจังหวะแตก
        .fromTo(".shock", { scale: 0.2, opacity: 1 }, { scale: 3.2, opacity: 0, duration: 0.8, ease: "power2.out", immediateRender: false }, "pop")
        .fromTo(".flash", { opacity: 0 }, { opacity: 0.45, duration: 0.06, yoyo: true, repeat: 1 }, "pop")
        .add(() => burst(fx, { ...packCenter(), count: 34, colors: [...PINK, "var(--gold-300)"], velocity: [180, 520], angle: [0, 360], gravity: 120, duration: 1.1, size: [2, 5] }), "pop")
        .fromTo(
          ".pack",
          // ไม่ animate filter (blur/brightness) — Android ต้องวาดใหม่ทุกเฟรม กระตุกหนัก
          { opacity: 0, y: 140, scale: 0.55 },
          { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "back.out(1.5)" },
          "pop",
        )
        .fromTo(".pack-tilt", { rotationX: 55, rotationY: -40 }, { rotationX: 0, rotationY: 0, duration: 1.3, ease: "elastic.out(1, 0.6)" }, "pop")
        .to(".pack-glow", { opacity: 0.6, duration: 0.8 }, "pop+=0.4")
        // เข้าที่แล้ว: แสงวาบผ่านฟอยล์ + ประกายวิบวับที่มุมซอง
        .fromTo(".pack-shine", { xPercent: 0 }, { xPercent: 420, duration: 0.8, ease: "power2.inOut" }, "pop+=0.7")
        .add(() => {
          const r = root.querySelector(".pack-body")!.getBoundingClientRect();
          const f = fx.getBoundingClientRect();
          [[0.06, 0.04], [0.94, 0.08], [0.1, 0.92], [0.9, 0.95]].forEach(([px, py], k) =>
            gsap.delayedCall(k * 0.12, () =>
              burst(fx, { x: r.left - f.left + r.width * px, y: r.top - f.top + r.height * py, count: 7, colors: ["white", "var(--gold-300)"], shape: "spark", velocity: [40, 120], angle: [0, 360], gravity: 0, duration: 0.6, size: [1.5, 2.5] }),
            ),
          );
        }, "pop+=0.9")
        .add(safe(idlePack));
    }

    return () => {
      cleanSparkles();
      window.removeEventListener("pointermove", onPointer);
    };
  }

  // อุ่นการ์ดล่วงหน้าระหว่างซองรอฉีก: decode รูป + ให้เบราว์เซอร์วาด layer ไว้ก่อน (opacity เกือบ 0 อยู่หลังซอง)
  // ไม่งั้นการ์ดโผล่ครั้งแรกตรงจังหวะดึงออกจากซองพอดี แล้ว decode/วาดพร้อมกัน 3 ใบ → Android กระตุก
  const pullStart = (cardH: number) => ({ ...STACK, y: cardH * 0.25, scale: 0.94 });
  function prewarmCards() {
    const cs = els();
    if (!cs.length) return;
    root.querySelectorAll<HTMLImageElement>(".deal-card img").forEach((img) => img.decode?.().catch(() => {}));
    gsap.set(cs, { visibility: "visible", opacity: 0.001, zIndex: (i: number) => 10 - i, ...pullStart(cs[0].offsetHeight) });
    gsap.set(cs.map((c) => q(c, ".card-flip")), { rotationY: 180 });
  }

  function idlePack() {
    packIdle = true;
    prewarmCards();
    gsap.to(".pack", { y: -12, duration: 1.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".pack-glow", { scale: 1.15, opacity: 0.85, duration: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".pack-shine", { xPercent: 420, duration: 1.3, repeat: -1, repeatDelay: 1.7, ease: "power2.inOut" });
    // ฟอยล์ขยับเองจนกว่าจะมีนิ้ว/เมาส์มาคุม (aim จะ kill tween นี้)
    gsap.fromTo(".pack-foil", { "--mx": "20%", "--my": "20%" }, { "--mx": "80%", "--my": "70%", duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.fromTo(
      ".pack-guide",
      { x: 0, opacity: 0 },
      {
        keyframes: [
          { opacity: 1, duration: 0.2 },
          { x: (_: number, el: HTMLElement) => el.parentElement!.clientWidth - 12, duration: 1.1, ease: "power2.inOut" },
          { opacity: 0, duration: 0.25 },
        ],
        repeat: -1,
        repeatDelay: 0.6,
      },
    );
  }

  // ---------- ฉีกซอง (แตะ หรือ ลากนิ้วผ่าน) ----------
  let drag: { x0: number; w: number; moved: boolean; p: number; spark: number } | null = null;

  function packDown(e: ReactPointerEvent<HTMLElement>) {
    if (s.phase !== "ready") return;
    unlockAudio(); // แตะแรกของผู้ใช้ — ปลดล็อกเสียงตามนโยบาย autoplay
    e.currentTarget.setPointerCapture(e.pointerId);
    drag = { x0: e.clientX, w: e.currentTarget.getBoundingClientRect().width, moved: false, p: 0, spark: 0 };
  }
  function packMove(e: ReactPointerEvent<HTMLElement>) {
    if (!drag) return;
    const dx = e.clientX - drag.x0;
    if (Math.abs(dx) > 6) drag.moved = true;
    drag.p = gsap.utils.clamp(0, 1, dx / (drag.w * 0.85));
    gsap.set(".pack-tear-line", { scaleX: drag.p });
    // แถบซีลค่อยๆ ลอกขึ้นตามนิ้ว (หมุนรอบมุมซ้ายล่าง)
    gsap.to(".pack-top", { rotation: -drag.p * 9, y: -drag.p * 6, duration: 0.15, overwrite: "auto" });
    // ประกายไฟตรงปลายรอยฉีก ทุกๆ ~8% ของระยะ
    if (drag.p - drag.spark > 0.08) {
      drag.spark = drag.p;
      sfx.peel();
      const line = root.querySelector(".pack-tear-line")!;
      const lr = line.getBoundingClientRect();
      const fr = fx.getBoundingClientRect();
      burst(fx, { x: lr.right - fr.left, y: lr.top - fr.top, count: 8, colors: ["white", "var(--gold-300)"], shape: "spark", velocity: [120, 320], angle: [-170, -10], gravity: 600, duration: 0.6, size: [1.5, 2.5] });
    }
  }
  function packUp() {
    const g = drag;
    drag = null;
    if (!g) return;
    if (!g.moved || g.p > 0.55) tear(g.p);
    else {
      gsap.to(".pack-tear-line", { scaleX: 0, duration: 0.35, ease: "power2.out" });
      gsap.to(".pack-top", { rotation: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
    }
  }

  function tear(p0: number) {
    if (s.phase !== "ready") return;
    if (!useStore.getState().consumePack()) return go("empty");
    unlockAudio(); // เผื่อฉีกด้วยคีย์บอร์ด (Enter) ซึ่งไม่ผ่าน packDown
    go("tearing");
    // ต้อง kill ฟอยล์ด้วย ไม่งั้นมันเลื่อน --mx ต่อระหว่างดึงการ์ด → วาดซองใหม่ทุกเฟรม
    gsap.killTweensOf([".pack", ".pack-guide", ".pack-shine", ".pack-glow", ".pack-tilt", ".pack-foil"]);
    packTilt = null;

    const tl = gsap.timeline();
    tl.to(".pack-guide", { opacity: 0, duration: 0.15 }, 0)
      .to(".pack-tilt", { rotationX: 0, rotationY: 0, duration: 0.3 }, 0)
      .to(".pack", { y: 0, duration: 0.3 }, 0)
      .to(".pack-tear-line", { scaleX: 1, duration: 0.35 * (1 - p0) + 0.05, ease: "power2.in" }, 0)
      // ลุ้น: ซองสั่นถี่ขึ้น ลอยเข้าหากล้อง แสงหลังซองบวมก่อนระเบิด
      .to(".pack", { rotation: 5, duration: 0.65, ease: "kd.rumble" }, 0.1)
      .add(sfx.rumble, 0.1)
      .to(".pack", { z: 90, duration: 0.65, ease: "power2.in" }, 0.1)
      .to(".pack-glow", { scale: 1.8, opacity: 1, duration: 0.65, ease: "power2.in" }, 0.1)
      .addLabel("rip", 0.75)
      .to(".pack", { z: 0, scale: 1, rotation: 0, duration: 0.2 }, "rip")
      .to(".pack-top", { x: 170, y: -240, z: 200, rotation: 48, rotationX: 120, opacity: 0, duration: 0.75, ease: "power2.out" }, "rip")
      .to(".pack-mouth", { opacity: 1, duration: 0.2 }, "rip")
      .to(".pack-tear-line", { opacity: 0, duration: 0.2 }, "rip")
      .fromTo(".pack-beam", { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.35, ease: "power4.out" }, "rip")
      .fromTo(".flash", { opacity: 0 }, { opacity: 0.9, duration: 0.07, yoyo: true, repeat: 1 }, "rip")
      .fromTo(".shock", { scale: 0.2, opacity: 1 }, { scale: 4.5, opacity: 0, duration: 0.9, ease: "power2.out" }, "rip")
      .to(".rays", { scale: 1.25, duration: 0.6, yoyo: true, repeat: 1, ease: "power2.out" }, "rip")
      .add(() => {
        shake(".camera", 14, 0.6);
        const c = centerIn(fx, root.querySelector(".pack-tilt")!, -0.38);
        burst(fx, { ...c, count: 60, colors: PINK, velocity: [350, 950], angle: [-165, -15], gravity: 900, duration: 1.8 });
        burst(fx, { ...c, count: 24, colors: ["white"], shape: "spark", velocity: [500, 1100], angle: [-150, -30], gravity: 300, duration: 0.9, size: [2, 3] });
      }, "rip")
      .to(".pack-beam", { opacity: 0.35, duration: 0.5 }, "rip+=0.4")
      // เริ่มดึงการ์ดตอนลำแสงยังอยู่ ไม่รอคลื่นกระแทกจบ — ไม่มีช่วงนิ่งระหว่างฉีกกับดึง
      .add(safe(deal), "rip+=0.35");
    speed(tl);
  }

  // ใบ Rare ที่ยังไม่ถูกเปิดถึง (อยู่ใต้ใบบนสุด) — ใช้ตัดสินว่าลากแล้วจะแอบเห็นขอบทองไหม
  const rareAhead = () => cards.some((m, k) => k > s.cur && m.rarity === "rare");

  // ---------- ดึงการ์ดออกจากซอง: การ์ดหงายซ้อนกันอยู่หลังตัวซอง (ซองอยู่ชั้นบน) เลื่อนขึ้นพ้นปากซอง
  //            แล้วซองร่วงลงไป การ์ดลงมาวางกลางโต๊ะเป็นกองที่ซ้อนกันพอดี ----------
  function deal() {
    go("reveal");
    const cs = els();
    const cardH = cs[0].offsetHeight;
    // ปกติอุ่นไว้แล้วตั้งแต่ idlePack — set ซ้ำเผื่อฉีกก่อนท่าเข้าฉากจบ
    gsap.set(cs, { visibility: "visible", zIndex: (i: number) => 10 - i, ...pullStart(cardH), opacity: 1 });
    gsap.set(cs.map((c) => q(c, ".card-flip")), { rotationY: 180 });

    const tl = gsap.timeline({ onComplete: safe(enableDrags) });
    tl.add(sfx.shuffle, 0.05)
      .to(cs, { y: -cardH * 0.62, duration: 0.75, ease: "power2.out", stagger: { each: 0.07, from: "end" } }, 0)
      .add(() => burst(fx, { ...centerIn(fx, root.querySelector(".pack-mouth")!), count: 30, colors: [...PINK, "var(--gold-300)"], velocity: [150, 450], angle: [-160, -20], gravity: 500, duration: 1.2, size: [3, 6] }), 0.1)
      .to(".pack-beam", { opacity: 0, duration: 0.3 }, 0.3)
      // ซองร่วงลงพร้อมเอียง — การ์ดค้างกลางอากาศครู่หนึ่ง
      .to(".pack", { y: () => window.innerHeight * 0.7, rotation: -10, opacity: 0, duration: 0.7, ease: "power3.in" }, 0.55)
      .to(cs, { ...STACK, duration: 0.7, ease: "back.out(1.6)", stagger: { each: 0.05, from: "end" } }, 0.95)
      .add(() => shake(".camera", 5, 0.3), 1.25)
      .add(() => reveal(0), 1.3);
    speed(tl);
  }

  // ใบบนสุดใหม่ขึ้นมาให้เห็นเต็มใบ — ถ้าเป็น Rare ค่อยเฉลยใหญ่ตรงนี้ (ลุ้นมาตลอดว่าอยู่ใบไหน)
  function reveal(i: number) {
    const el = els()[i];
    const rare = cards[i].rarity === "rare";
    const tl = gsap.timeline();
    if (rare) {
      tl.to(".stack-tell", { opacity: 0, duration: 0.2 }, 0)
        .to(".rays-gold", { opacity: 0.8, duration: 0.7 }, 0)
        .to(".rays", { opacity: 0.25, duration: 0.7 }, 0)
        .to(q(el, ".card-aura"), { opacity: 1, scale: 1.2, duration: 0.8, ease: "power2.in" }, 0)
        .to(el, { rotation: 3, duration: 0.8, ease: "kd.rumble" }, 0)
        .fromTo(".rare-label", { opacity: 0, scale: 0.5, y: 0 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(3)" }, 0.15)
        .to(".rare-label", { duration: 0.8, scrambleText: { text: "RARE!", chars: "★✦✧◆✶", speed: 0.5 } }, 0.15);
    }
    // การ์ดใบแรกขึ้นมาพร้อมจังหวะดึงออกจากซอง — ใบธรรมดาไม่มีเสียง (ตามที่ตกลงไว้)
    if (rare) tl.add(sfx.rareRise, 0);
    tl.addLabel("flip");
    if (rare) tl.add(sfx.rare, "flip");
    else if (i > 0) tl.add(sfx.pop, "flip");
    // การ์ดหงายอยู่แล้ว — Rare หมุนโชว์อีกรอบเป็นการเฉลย ใบธรรมดาแค่เด้ง
    if (rare) tl.to(q(el, ".card-flip"), { rotationY: "+=360", duration: 1, ease: "back.out(1.5)" }, "flip");
    tl
      .to(el, { scale: 1.1, rotation: 0, duration: 0.15, ease: "power2.out" }, "flip")
      .to(el, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.45)" }, "flip+=0.15")
      .add(() => {
        const c = centerIn(fx, el);
        burst(
          fx,
          rare
            ? { ...c, count: 110, colors: GOLD, shape: "confetti", velocity: [350, 1000], angle: [-175, -5], gravity: 800, duration: 2.2, size: [6, 11] }
            : { ...c, count: 30, colors: PINK, velocity: [160, 480], angle: [-180, 0], gravity: 600, duration: 1.2 },
        );
        if (rare) shake(".camera", 12, 0.6);
      }, rare ? "flip+=0.5" : "flip+=0.1");
    if (rare) {
      tl.fromTo(".flash", { opacity: 0 }, { opacity: 0.7, duration: 0.07, yoyo: true, repeat: 1 }, "flip+=0.5")
        .fromTo(".shock", { scale: 0.2, opacity: 1 }, { scale: 4, opacity: 0, duration: 0.9, ease: "power2.out" }, "flip+=0.5")
        .to(".rare-label", { opacity: 0, y: -40, duration: 0.5, ease: "power2.in" }, "flip+=1.5")
        .to(".rays-gold", { opacity: 0.25, duration: 1.2 }, "flip+=1.2")
        .to(".rays", { opacity: 1, duration: 1.2 }, "flip+=1.2");
    }
    // ใบสุดท้าย: ไม่ต้องปัดทิ้ง — ค้างให้ดูแป๊บหนึ่งแล้วเข้า gallery เอง (ปัด/แตะก่อนก็ข้ามได้)
    // นับเวลาตั้งแต่การเฉลยจบ (ไม่รอแสงทองจางหมด ซึ่งช้ากว่ามาก)
    if (i === cards.length - 1) tl.add(() => (s.autoGallery = gsap.delayedCall(LAST_HOLD, safe(gather))), rare ? "flip+=1.1" : "flip+=0.7");
    speed(tl);
  }

  // selector string นอก context จะไม่มี scope — ชี้ element ตรงๆ แทน
  const tell = () => root.querySelector(".stack-tell");
  const safeDismiss = safe((i: number, dir: number) => dismiss(i, dir));

  let nudge: gsap.core.Timeline | null = null;

  function enableDrags() {
    s.drags = els().map((el, i) =>
      Draggable.create(el, {
        type: "x,y",
        minimumMovement: 4,
        zIndexBoost: false,
        onClick: safe(() => s.cur === i && !s.busy && dismiss(i, i % 2 ? -1 : 1)),
        // ลากใบบนแง้มออก: การ์ดเอียงตามนิ้ว และถ้ามี Rare ซ่อนอยู่ใต้กอง ขอบทองจะเรืองรอบกองตามระยะลาก
        // นิ้วแตะเมื่อไหร่ หยุดท่าแง้มชวนลากทันที ไม่งั้น tween แย่ง x กับนิ้ว
        onPress: () => {
          nudge?.kill();
          unlockAudio();
        },
        // ห้ามห่อด้วย safe: contextSafe เรียกฟังก์ชันด้วย this = gsap context ทำให้อ่าน this.x ของ Draggable ไม่ได้
        onDrag(this: Draggable) {
          gsap.set(el, { rotation: this.x * 0.08 });
          if (rareAhead()) gsap.set(tell(), { opacity: gsap.utils.clamp(0, 1, Math.abs(this.x) / 70) });
        },
        onDragEnd(this: Draggable) {
          if (Math.abs(this.x) > SWIPE_OUT) return safeDismiss(i, Math.sign(this.x));
          gsap.to(el, { ...STACK, duration: 0.6, ease: "elastic.out(1, 0.5)" });
          gsap.to(tell(), { opacity: 0, duration: 0.3 });
        },
      })[0],
    );
    s.drags.forEach((g, k) => (k === 0 ? g.enable() : g.disable()));
    // ชวนลาก: ใบบนสุดแง้มซ้ายขวาเองครั้งหนึ่ง ถ้ามี Rare ก็แอบเห็นขอบทองวาบให้รู้ว่ามีอะไรรออยู่
    if (!reduced) {
      const el = els()[0];
      nudge = gsap
        .timeline({ delay: 0.9 })
        .to(el, { x: 26, rotation: 2, duration: 0.35, ease: "power2.out" })
        .to(".stack-tell", { opacity: rareAhead() ? 0.8 : 0, duration: 0.35 }, 0)
        .to(el, { x: 0, rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" })
        .to(".stack-tell", { opacity: 0, duration: 0.4 }, "<");
    }
  }

  // ---------- ปัดใบบนทิ้ง → ใบถัดไปพลิกหงายเอง ----------
  function dismiss(i: number, dir: number) {
    if (s.cur !== i || s.busy) return;
    s.busy = true;
    s.drags[i]?.disable();
    sfx.swipe();
    const cs = els();
    gsap.to(".stack-tell", { opacity: 0, duration: 0.2 });
    gsap.to(cs[i], {
      x: dir * window.innerWidth * 0.95,
      y: "-=60",
      rotation: dir * 28,
      duration: 0.4,
      ease: "power2.in",
      onComplete: safe(() => {
        s.busy = false;
        s.cur = i + 1;
        if (s.cur < cs.length) {
          d.setCur(s.cur);
          s.drags[s.cur]?.enable();
          reveal(s.cur);
        } else gather();
      }),
    });
  }

  // ---------- gallery: การ์ดทั้ง 3 ย่อลงเป็นรูปย่อแถวล่าง การ์ดใหญ่ด้านบนโชว์ใบที่เลือก ----------
  function gather() {
    if (s.phase !== "reveal") return;
    s.phase = "spreading";
    s.autoGallery?.kill();
    s.drags.forEach((g) => g.kill());
    gsap.to(".rare-label", { opacity: 0, y: -30, duration: 0.3 });
    gsap.to(".rays-gold", { opacity: 0.2, duration: 0.8 });
    gsap.to(".rays", { opacity: 1, duration: 0.8 });
    const cs = els();
    const sc = THUMB_W / cs[0].offsetWidth;
    const thumbH = THUMB_W * 1.4;
    const rowY = table.clientHeight / 2 - thumbH / 2 - THUMB_LIFT;
    gsap.to(cs, {
      x: (i: number) => (i - 1) * (THUMB_W + 16),
      y: rowY,
      rotation: 0,
      scale: sc,
      opacity: 0.55,
      zIndex: 1,
      duration: 0.8,
      ease: "back.out(1.4)",
      stagger: 0.1,
      onComplete: safe(() => {
        go("choose");
        // เปิด gallery ที่ใบ Rare ก่อนถ้ามี — ใบเด่นสุดของซอง
        const rareIdx = cards.findIndex((m) => m.rarity === "rare");
        choose(rareIdx >= 0 ? rareIdx : 0);
      }),
    });
    cs.forEach((c) => c.dataset.rare && gsap.to(q(c, ".card-aura"), { opacity: 0.5, scale: 0.9, duration: 0.6, overwrite: "auto" }));
  }

  function choose(i: number) {
    if (s.phase !== "choose" || s.selected === i) return;
    s.selected = i;
    d.setSelected(i);
    sfx.tick();
    // รูปย่ออยู่ตำแหน่งเดิมตลอด — บอกใบที่เลือกด้วยกรอบชมพูกับความทึบเท่านั้น ไม่ยกขึ้น
    gsap.to(els(), { opacity: (k: number) => (k === i ? 1 : 0.55), duration: 0.2, overwrite: "auto" });
    gsap.to(els().map((c) => q(c, ".card-ring")), { opacity: (k: number) => (k === i ? 1 : 0), duration: 0.2 });
  }

  /** การ์ดใหญ่ remount ทุกครั้งที่เปลี่ยนใบ (key) — เรียกจาก layout effect ก่อน paint จึงไม่เห็นหลังการ์ดแวบ */
  function showPreview() {
    const card = root.querySelector(".preview-card");
    if (!card) return;
    const flipEl = q(card, ".card-flip");
    const rare = cards[s.selected]?.rarity === "rare";
    gsap.set(flipEl, { rotationY: 180 });
    const tl = gsap.timeline();
    tl.fromTo(flipEl, { rotationY: 0 }, { rotationY: 180, duration: 0.6, ease: "back.out(1.6)" })
      .fromTo(card, { scale: 0.85, y: 20, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, 0);
    if (rare) {
      tl.to(q(card, ".card-aura"), { opacity: 0.8, scale: 1.1, duration: 1.2, repeat: -1, yoyo: true, ease: "sine.inOut" }, 0.2)
        // holo กวาดครั้งเดียว — วนไม่หยุดจะวาดการ์ด (รูป + blend) ใหม่ทุกเฟรมตลอดเวลา
        .fromTo(q(card, ".card-front"), { "--mx": "0%", "--my": "100%" }, { "--mx": "100%", "--my": "0%", duration: 1.4, ease: "sine.inOut" }, 0)
        .add(() => burst(fx, { ...centerIn(fx, card), count: 26, colors: GOLD, velocity: [60, 200], angle: [0, 360], gravity: 0, duration: 1.1, size: [2, 5] }), 0.3);
    }
    speed(tl);
  }

  function save() {
    if (s.phase !== "choose" || s.selected < 0) return;
    useStore.getState().addCard(cards[s.selected].id);
    sfx.save();
    go("saved");
  }

  // ---------- เก็บเข้าคอลเลกชัน: เรียกหลัง React render ปุ่มของเฟส saved แล้ว ----------
  function celebrate() {
    const card = root.querySelector(".preview-card");
    if (!card) return;
    const tl = gsap.timeline();
    tl.to(els(), { y: "+=60", opacity: 0, duration: 0.4, ease: "power2.in", stagger: 0.05 }, 0)
      .to(card, { scale: 1.08, duration: 0.5, ease: "power2.out" }, 0)
      .to(q(card, ".card-flip"), { rotationY: "+=360", duration: 1.1, ease: "power3.inOut" }, 0.1)
      .to(card, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" }, 1.1)
      .addLabel("land", 1.1)
      .fromTo(".flash", { opacity: 0 }, { opacity: 0.7, duration: 0.07, yoyo: true, repeat: 1 }, "land")
      .fromTo(".shock", { scale: 0.3, opacity: 1 }, { scale: 5, opacity: 0, duration: 1, ease: "power2.out" }, "land")
      .add(() => {
        burst(fx, { ...centerIn(fx, card), count: 140, colors: [...PINK, ...GOLD], shape: "confetti", velocity: [450, 1150], angle: [-175, -5], gravity: 850, duration: 2.6, size: [6, 12] });
        shake(".camera", 10, 0.5);
      }, "land")
      .add(sfx.stamp, "land+=0.57")
      .fromTo(".stamp", { scale: 3.2, opacity: 0, rotation: -32 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.42, ease: "power4.in" }, "land+=0.15")
      .add(() => shake(".camera", 7, 0.35), "land+=0.57")
      .from(".saved-action", { y: 28, opacity: 0, duration: 0.55, stagger: 0.08, ease: "power3.out" }, "land+=0.35")
      .fromTo(q(card, ".card-front"), { "--mx": "0%", "--my": "100%" }, { "--mx": "100%", "--my": "0%", duration: 1.4, ease: "sine.inOut" }, "land+=0.6");
    speed(tl);
  }

  return {
    intro,
    packDown: safe(packDown),
    packMove: safe(packMove),
    packUp: safe(packUp),
    tear: safe(tear),
    choose: safe(choose),
    showPreview: safe(showPreview),
    save: safe(save),
    celebrate: safe(celebrate),
  };
}
