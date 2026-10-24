import Image from "next/image";
import type { Menu } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * รูปการ์ดสำเร็จรูปจากดีไซเนอร์ (5:7) — frontend ไม่จัด layout ชื่อ/ราคาเอง
 * Rare ได้กรอบทอง + ประกายวิ่ง ส่วน holo ที่ตามนิ้วมีแค่ในหน้าเปิดซอง
 */
export function FoodCard({
  menu,
  sizes = "(max-width: 448px) 33vw, 150px",
  priority,
  className,
}: {
  menu: Menu;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const rare = menu.rarity === "rare";
  return (
    <div
      className={cn(
        "relative aspect-[5/7] overflow-hidden rounded-[6%/4.3%] bg-muted shadow-card",
        rare && "ring-2 ring-gold-500",
        className,
      )}
    >
      <Image src={menu.image} alt={menu.name} width={750} height={1050} sizes={sizes} priority={priority} className="size-full object-cover" />
      {rare && (
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        </span>
      )}
    </div>
  );
}

/** ช่องการ์ดที่ยังไม่ได้ — เงาทึบให้รู้ว่ายังมีให้สะสม */
export function CardSilhouette({ id, className }: { id: string; className?: string }) {
  return (
    <div
      className={cn(
        "grid aspect-[5/7] place-items-center rounded-[6%/4.3%] border-2 border-dashed border-ink-400/40 bg-badge",
        className,
      )}
    >
      <span className="font-heading text-2xl font-bold text-ink-400">?</span>
      <span className="sr-only">ยังไม่ได้การ์ดหมายเลข {id}</span>
    </div>
  );
}
