import Image from "next/image";
import { CardBack } from "@/components/card-back";
import type { Menu } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * หน้า-หลังการ์ดที่พลิกได้ (.card-flip หมุน rotationY) — การ์ดแบน 2D แต่ละใบมี perspective ของตัวเอง
 * จึงพลิกดูมีมิติได้โดยไม่มีการ์ดใบไหนซ้อนทะลุกันในแกน Z
 */
export function CardFaces({ menu, sizes = "250px" }: { menu: Menu; sizes?: string }) {
  const rare = menu.rarity === "rare";
  return (
    <div className="card-flip relative aspect-[5/7] w-full [transform-style:preserve-3d]">
      <div className="absolute inset-0 [backface-visibility:hidden]">
        <CardBack className="size-full shadow-[0_20px_40px_-12px_oklch(0_0_0/0.7)]" />
      </div>
      <div
        className={cn(
          "card-front absolute inset-0 overflow-hidden rounded-[6%/4.3%] [backface-visibility:hidden] [transform:rotateY(180deg)]",
          "shadow-[0_20px_40px_-12px_oklch(0_0_0/0.7)]",
          rare && "ring-2 ring-gold-300",
        )}
      >
        {/* draggable=false: ไม่งั้นกดบนรูปแล้วเบราว์เซอร์เริ่มลากรูปเอง แย่ง Draggable ของการ์ด */}
        <Image src={menu.image} alt={menu.name} width={750} height={1050} sizes={sizes} priority draggable={false} className="pointer-events-none size-full object-cover" />
        {/* holo: ไล่สีรุ้งแบบ color-dodge เลื่อนตาม --mx/--my ที่ GSAP ขยับ — Rare เข้มกว่า Common */}
        <div
          className={cn("pointer-events-none absolute inset-0 mix-blend-color-dodge", rare ? "opacity-70" : "opacity-25")}
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 20%, oklch(0.85 0.15 350 / 0.7) 36%, oklch(0.9 0.14 90 / 0.7) 46%, oklch(0.85 0.12 200 / 0.7) 56%, transparent 72%)",
            backgroundSize: "250% 250%",
            backgroundPosition: "var(--mx, 50%) var(--my, 50%)",
          }}
        />
      </div>
    </div>
  );
}

function RareAura() {
  return (
    <div
      className="card-aura pointer-events-none absolute -inset-[30%] rounded-full bg-[radial-gradient(circle,var(--gold-300)_0%,var(--gold-500)_25%,transparent_62%)] opacity-0"
    />
  );
}

/** การ์ดบนโต๊ะ: กองตอนเปิด แล้วย่อเป็นแถวรูปย่อของ gallery ตอนเลือก */
export function DealCard({ menu, index, onSelect }: { menu: Menu; index: number; onSelect: () => void }) {
  const rare = menu.rarity === "rare";
  return (
    <div
      data-i={index}
      data-rare={rare || undefined}
      onClick={onSelect}
      className="deal-card relative col-start-1 row-start-1 w-[min(62vw,250px)] touch-none [perspective:1000px]"
      style={{ visibility: "hidden" }}
    >
      {rare && <RareAura />}
      <div className="card-ring pointer-events-none absolute -inset-2 rounded-[8%/6%] opacity-0 ring-[6px] ring-primary shadow-[0_0_30px_6px_var(--ci-rose-500)]" />
      <CardFaces menu={menu} />
    </div>
  );
}

/** การ์ดใหญ่ของ gallery — key ตามใบที่เลือก ให้ remount แล้วเล่นท่าพลิกเข้าใหม่ทุกครั้ง */
export function PreviewCard({ menu }: { menu: Menu }) {
  return (
    <div className="preview-card relative aspect-[5/7] h-full max-h-[420px] max-w-full [perspective:1000px]">
      {menu.rarity === "rare" && <RareAura />}
      <CardFaces menu={menu} sizes="320px" />
    </div>
  );
}
