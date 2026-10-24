"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { CustomWiggle } from "gsap/CustomWiggle";
import { Draggable } from "gsap/Draggable";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

// plugin ของ GSAP ลงทะเบียนได้เฉพาะในเบราว์เซอร์ (ตอน SSR ไม่มี window ทำให้ CustomEase พัง)
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, CustomEase, CustomWiggle, Draggable, Physics2DPlugin, ScrambleTextPlugin);
  // สั่นแบบค่อยๆ ซา (กระแทก) กับสั่นคงที่ (ลุ้นก่อนเปิด Rare)
  CustomWiggle.create("kd.shake", { wiggles: 9, type: "easeOut" });
  CustomWiggle.create("kd.rumble", { wiggles: 18, type: "uniform" });
}

export { gsap, Draggable };

export const PINK = ["var(--ci-rose-500)", "var(--ci-rose-300)", "var(--ci-rose-100)", "white"];
export const GOLD = ["var(--gold-500)", "var(--gold-300)", "white", "var(--ci-rose-300)"];

/**
 * งบอนุภาค: ทุก burst/converge คูณด้วยค่านี้ — Android รุ่นกลางๆ กระตุกเมื่ออนุภาคเยอะ
 * (แต่ละเม็ดเป็น DOM node + 2 tween) จึงลดเหลือราว 1/3 ของที่ออกแบบไว้ ปรับที่นี่ที่เดียว
 */
const PARTICLE_SCALE = 0.35;
const budget = (n: number) => Math.max(4, Math.round(n * PARTICLE_SCALE));

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** จุดกึ่งกลางของ el ในพิกัดของ layer — ใช้วางจุดเริ่มอนุภาค */
export function centerIn(layer: HTMLElement, el: Element, offsetY = 0) {
  const a = layer.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  return { x: b.left - a.left + b.width / 2, y: b.top - a.top + b.height / 2 + offsetY * b.height };
}

type BurstOptions = {
  x: number;
  y: number;
  count: number;
  colors: string[];
  shape?: "dot" | "confetti" | "spark";
  velocity?: [number, number];
  angle?: [number, number];
  gravity?: number;
  duration?: number;
  size?: [number, number];
};

/**
 * ระเบิดอนุภาคด้วย Physics2D — สร้าง span ใน layer ที่ React ไม่ได้ render ลูกไว้
 * (GSAP เป็นเจ้าของ DOM ก้อนนี้คนเดียว) แล้วลบทิ้งเองเมื่อจบ
 */
export function burst(layer: HTMLElement | null, o: BurstOptions) {
  if (!layer || prefersReducedMotion()) return;
  const { shape = "dot", velocity = [250, 650], angle = [-170, -10], gravity = 700, duration = 1.6, size = [4, 9] } = o;
  for (let i = 0, n = budget(o.count); i < n; i++) {
    const el = document.createElement("span");
    const s = gsap.utils.random(size[0], size[1]);
    const color = o.colors[i % o.colors.length];
    Object.assign(el.style, {
      position: "absolute",
      left: `${o.x}px`,
      top: `${o.y}px`,
      width: `${shape === "confetti" ? s * 0.7 : s}px`,
      height: `${shape === "confetti" ? s * 1.6 : shape === "spark" ? s * 3 : s}px`,
      background: color,
      borderRadius: shape === "dot" ? "50%" : "2px",
      willChange: "transform, opacity",
    });
    layer.appendChild(el);
    gsap.set(el, { xPercent: -50, yPercent: -50 });
    gsap.to(el, {
      physics2D: { velocity: gsap.utils.random(...velocity), angle: gsap.utils.random(...angle), gravity },
      rotation: gsap.utils.random(-540, 540),
      rotationX: shape === "confetti" ? gsap.utils.random(-900, 900) : 0,
      duration: duration * gsap.utils.random(0.7, 1.1),
      ease: "none",
      onComplete: () => el.remove(),
    });
    gsap.to(el, { opacity: 0, duration: duration * 0.4, delay: duration * 0.5, ease: "power1.in" });
  }
}

/** สั่นกล้องทั้งเวที — ใช้ตอนฉีกซอง/กระแทก */
export function shake(target: gsap.TweenTarget, strength = 10, duration = 0.5) {
  if (prefersReducedMotion()) return gsap.timeline();
  return gsap
    .timeline()
    .fromTo(target, { x: 0 }, { x: strength, duration, ease: "kd.shake" }, 0)
    .fromTo(target, { y: 0 }, { y: strength * 0.6, duration: duration * 0.9, ease: "kd.shake" }, 0);
}

/** ประกายลอยในอากาศตลอดเวลา — สร้างครั้งเดียวต่อรอบ คืนฟังก์ชันล้าง */
export function ambientSparkles(layer: HTMLElement, count = 10) {
  layer.replaceChildren();
  if (prefersReducedMotion()) return () => layer.replaceChildren();
  const { innerWidth: w, innerHeight: h } = window;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    const s = gsap.utils.random(2, 5);
    Object.assign(el.style, {
      position: "absolute",
      width: `${s}px`,
      height: `${s}px`,
      borderRadius: "50%",
      background: i % 3 ? "var(--ci-rose-300)" : "white",
    });
    layer.appendChild(el);
    gsap.set(el, { x: gsap.utils.random(0, w), y: gsap.utils.random(0, h), opacity: 0 });
    gsap.to(el, { y: `-=${gsap.utils.random(80, 240)}`, x: `+=${gsap.utils.random(-40, 40)}`, duration: gsap.utils.random(5, 11), repeat: -1, ease: "none", delay: -gsap.utils.random(0, 10) });
    gsap.to(el, { opacity: gsap.utils.random(0.3, 0.9), duration: gsap.utils.random(0.8, 2), repeat: -1, yoyo: true, ease: "sine.inOut", delay: gsap.utils.random(0, 2) });
  }
  return () => {
    gsap.killTweensOf(layer.children);
    layer.replaceChildren();
  };
}

/** ประกายลอยมาจากรอบจอแล้วดูดเข้าจุดเดียว (กลับด้านของ burst) — ใช้ตอนอัญเชิญซอง */
export function converge(layer: HTMLElement | null, o: { x: number; y: number; count: number; colors: string[]; radius?: number; duration?: number }) {
  if (!layer || prefersReducedMotion()) return;
  const { radius = 260, duration = 0.9 } = o;
  for (let i = 0, n = budget(o.count); i < n; i++) {
    const el = document.createElement("span");
    const s = gsap.utils.random(2, 5);
    const color = o.colors[i % o.colors.length];
    Object.assign(el.style, {
      position: "absolute",
      left: `${o.x}px`,
      top: `${o.y}px`,
      width: `${s}px`,
      height: `${s}px`,
      borderRadius: "50%",
      background: color,
    });
    layer.appendChild(el);
    const a = gsap.utils.random(0, Math.PI * 2);
    const r = gsap.utils.random(radius * 0.5, radius);
    gsap.fromTo(
      el,
      { xPercent: -50, yPercent: -50, x: Math.cos(a) * r, y: Math.sin(a) * r, opacity: 0, scale: 0.4 },
      {
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1.4,
        duration: duration * gsap.utils.random(0.7, 1),
        delay: gsap.utils.random(0, duration * 0.35),
        ease: "power2.in",
        onComplete: () => el.remove(),
      },
    );
  }
}
