import Image from "next/image";
import { Scissors, Soup } from "lucide-react";
import { APP_NAME, PACK_NAME } from "@/config/flow";
import type { Canteen } from "@/lib/types";
import { cn } from "@/lib/utils";

// ฟันปลาของรอยซีล: ล่างของแถบบน กับ ล่างสุดของตัวซอง
const teeth = (n: number, hi: number, lo: number) =>
  Array.from({ length: n + 1 }, (_, i) => `${(i * 100) / n}% ${i % 2 ? lo : hi}%`);
const TOP_EDGE = `polygon(0 0, 100% 0, ${teeth(20, 84, 100).reverse().join(", ")})`;
const BODY_EDGE = `polygon(0 0, 100% 0, ${teeth(24, 97, 100).reverse().join(", ")})`;

// ลายรอยจีบของซีลซองจริง — เส้นตั้งถี่ๆ (สว่างบนพื้นเข้ม / เข้มบนพื้นสว่าง)
const crimp = (line: string) => `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px 5px)`;
const CRIMP_LIGHT = crimp("oklch(1 0 0 / 0.35)");
const CRIMP_DARK = crimp("oklch(0.547 0.156 5.8 / 0.35)");

/**
 * ซองการ์ดแบบ TCG — ฟอยล์ทรงหมอน ซีลหยักบน-ล่าง โลโก้ + รูปโรงอาหารในกรอบโค้ง
 * แยกชิ้นเป็นเป้าของ GSAP (ดู director.ts):
 *   .pack (ตำแหน่ง) > .pack-tilt (เอียงตามนิ้ว) > .pack-body (ตัวซอง) + .pack-top (แถบที่ถูกฉีก)
 *   .pack-foil (ฟอยล์รุ้งเลื่อนตาม --mx) · .pack-shine (แสงวิ่ง) · .pack-mouth (ปากซองหลังฉีก) · .pack-beam (ลำแสง)
 */
export function BoosterPack({ canteen, locked }: { canteen: Canteen; locked?: boolean }) {
  return (
    <div className={cn("pack relative aspect-[5/8] w-[min(68vw,270px)] select-none", locked && "grayscale")}>
      {/* ไม่ใช้ filter blur — แสง/เงาเป็น radial gradient ล้วน ขยับแล้วไม่ต้องวาดใหม่ทุกเฟรม (Android) */}
      <div className="pack-glow absolute -inset-12 rounded-full bg-[radial-gradient(circle,var(--ci-rose-500)_0%,transparent_65%)] opacity-60" />
      <div className="absolute inset-x-[6%] -bottom-[5%] h-[10%] rounded-[50%] bg-[radial-gradient(ellipse,oklch(0_0_0/0.55),transparent_70%)]" />

      <div className="pack-tilt relative size-full [transform-style:preserve-3d]">
        {/* ---------- ตัวซอง ---------- */}
        <div
          className="pack-body absolute inset-x-0 top-[12%] bottom-0 overflow-hidden bg-[linear-gradient(165deg,var(--ci-rose-500)_0%,var(--ci-rose-700)_40%,var(--ci-rose-900)_100%)]"
          style={{ clipPath: BODY_EDGE }}
        >
          {/* รัศมีพุ่งจากโลโก้ */}
          <div
            className="absolute inset-0 opacity-15"
            style={{ backgroundImage: "repeating-conic-gradient(from 0deg at 50% 22%, white 0deg 4deg, transparent 4deg 14deg)" }}
          />
          {/* ฟอยล์รุ้ง: color-dodge เลื่อนตามมุมเอียง (--mx/--my จาก GSAP) */}
          <div
            className="pack-foil absolute inset-0 opacity-30 mix-blend-color-dodge"
            style={{
              backgroundImage:
                "linear-gradient(120deg, transparent 15%, oklch(0.85 0.15 350 / 0.8) 32%, oklch(0.92 0.13 95 / 0.8) 44%, oklch(0.86 0.12 210 / 0.8) 56%, transparent 75%)",
              backgroundSize: "260% 260%",
              backgroundPosition: "var(--mx, 30%) var(--my, 30%)",
            }}
          />
          {/* ทรงหมอน: ขอบซ้าย-ขวามืดลงเหมือนซองที่พองตัว */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0_0_0/0.35),transparent_14%,transparent_86%,oklch(0_0_0/0.35))]" />

          {/* ปากซองที่เปิดออกหลังฉีก — มืดด้านใน */}
          <div className="pack-mouth absolute inset-x-[4%] top-0 h-[7%] rounded-b-[50%] bg-[radial-gradient(ellipse_at_top,oklch(0.12_0.03_350),oklch(0.25_0.06_350)_60%,transparent)] opacity-0" />

          <div className="relative flex h-full flex-col items-center px-[7%] pt-[9%] text-center text-white">
            <p className="font-heading text-[clamp(1.8rem,11vw,2.6rem)] leading-[1.2] font-bold [text-shadow:0_3px_0_var(--ci-rose-900),0_0_18px_oklch(1_0_0/0.5)]">
              {APP_NAME}
            </p>
            <p className="mt-1 rounded-full bg-white/20 px-3 text-sm font-bold ring-1 ring-white/40">{PACK_NAME}</p>

            {/* หน้าต่างโค้งรูปโรงอาหาร — ทำให้แต่ละซองต่างกันตามโรงอาหาร */}
            <div className="relative mt-[8%] aspect-[4/5] w-[74%]">
              <div className="absolute inset-0 overflow-hidden rounded-t-full rounded-b-2xl bg-rose-900 ring-4 ring-white/80">
                {canteen.image ? (
                  <Image src={canteen.image} alt="" fill sizes="200px" priority draggable={false} className="pointer-events-none object-cover" />
                ) : (
                  <div className="grid size-full place-items-center">
                    <Soup className="size-1/2 text-white/80" strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--ci-rose-900),transparent_55%)]" />
              </div>
              {/* ป้ายจำนวนการ์ดแบบดาวแฉก */}
              <div
                className="absolute -top-[6%] -right-[14%] grid aspect-square w-[42%] rotate-12 place-items-center bg-gold-300 text-ink-900 shadow-lg"
                style={{
                  clipPath:
                    "polygon(50% 0, 61% 14%, 79% 9%, 80% 27%, 97% 33%, 87% 50%, 97% 67%, 80% 73%, 79% 91%, 61% 86%, 50% 100%, 39% 86%, 21% 91%, 20% 73%, 3% 67%, 13% 50%, 3% 33%, 20% 27%, 21% 9%, 39% 14%)",
                }}
              >
                <span className="font-heading text-lg leading-[1.1] font-bold">
                  3<br />
                  <span className="text-xs">ใบ</span>
                </span>
              </div>
            </div>

            <p className="mt-auto mb-[9%] w-[88%] truncate rounded-md bg-white py-0.5 font-heading text-sm font-bold text-rose-900 shadow-md">
              {canteen.name}
            </p>
          </div>

          <div className="pack-shine absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent" />
          {/* ซีลล่าง */}
          <div className="absolute inset-x-0 bottom-0 h-[5%] bg-rose-900/40" style={{ backgroundImage: CRIMP_LIGHT }} />
        </div>

        {/* ---------- แถบซีลบนที่จะถูกฉีก ---------- */}
        <div
          className="pack-top absolute inset-x-0 top-0 h-[14%] origin-bottom-left bg-[linear-gradient(180deg,var(--ci-rose-100),var(--ci-rose-300))]"
          style={{ clipPath: TOP_EDGE }}
        >
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: CRIMP_DARK }} />
          <p className="relative flex h-[84%] items-center justify-center gap-1 text-xs font-bold text-rose-900">
            <Scissors className="size-3.5" />
            ฉีกตรงนี้
          </p>
        </div>

        {/* รอยฉีก: ขีดเรืองแสงยืดตามนิ้ว + จุดนำทาง */}
        <div className="pointer-events-none absolute inset-x-1 top-[12.5%] h-1 -translate-y-1/2">
          <div className="pack-tear-line h-full origin-left scale-x-0 rounded-full bg-white shadow-[0_0_12px_4px_white]" />
          {!locked && (
            <div className="pack-guide absolute top-1/2 left-0 size-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_6px_var(--ci-rose-300)]" />
          )}
        </div>

        {/* ลำแสงพุ่งจากปากซองตอนฉีก */}
        <div className="pack-beam pointer-events-none absolute bottom-[88%] left-1/2 h-[70vh] w-[130%] -translate-x-1/2 origin-bottom scale-y-0 bg-[linear-gradient(to_top,white,oklch(1_0_0/0.5)_20%,transparent)] opacity-0 [clip-path:polygon(38%_100%,62%_100%,100%_0,0_0)]" />
      </div>
    </div>
  );
}
