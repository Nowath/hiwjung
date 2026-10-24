"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CardGrid, type GridItem } from "@/components/card-grid";
import { LinkShareButton } from "@/components/share-buttons";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { canteens, menus } from "@/lib/data";
import { encodeCollection } from "@/lib/share";
import { useHydrated, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Sort = "number" | "recent" | "rare";
const SORTS: { id: Sort; label: string }[] = [
  { id: "number", label: "เลขการ์ด" },
  { id: "recent", label: "ล่าสุด" },
  { id: "rare", label: "หายาก" },
];

const chip = cn(
  "h-10 rounded-full bg-card px-4 text-base shadow-card",
  "data-[pressed]:bg-primary data-[pressed]:text-primary-foreground hover:data-[pressed]:bg-primary",
);

export function CollectionView() {
  const hydrated = useHydrated();
  const collection = useStore((s) => s.collection);
  const [canteen, setCanteen] = useState("all");
  const [sort, setSort] = useState<Sort>("number");

  const entries = Object.values(collection);
  const got = entries.length;
  const rareGot = entries.filter((e) => menus.find((m) => m.id === e.menuId)?.rarity === "rare").length;

  const items = useMemo<GridItem[]>(() => {
    const list = menus
      .filter((m) => canteen === "all" || m.canteenId === canteen)
      .map((menu) => ({ menu, count: collection[menu.id]?.count ?? 0, lastAt: collection[menu.id]?.lastAt ?? "" }));
    // ช่องที่ยังไม่ได้อยู่ท้ายเสมอ ไม่ว่าจะเรียงแบบไหน
    return list.sort((a, b) => {
      if (!!a.count !== !!b.count) return a.count ? -1 : 1;
      if (sort === "recent") return b.lastAt.localeCompare(a.lastAt);
      if (sort === "rare" && a.menu.rarity !== b.menu.rarity) return a.menu.rarity === "rare" ? -1 : 1;
      return a.menu.id.localeCompare(b.menu.id);
    });
  }, [collection, canteen, sort]);

  if (!hydrated) return <CollectionSkeleton />;

  return (
    <div className="rise">
      <section className="rounded-card bg-card p-4 shadow-card">
        <p className="text-base text-muted-foreground">เก็บไปแล้ว</p>
        <p className="font-heading text-4xl font-bold">
          {got} <span className="text-2xl text-muted-foreground">/ {menus.length} เมนู</span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full origin-left rounded-full bg-primary transition-transform duration-(--dur-slow) ease-(--ease-out)"
            style={{ transform: `scaleX(${got / menus.length})` }}
          />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-base text-ink-700">
          <Sparkles className="size-4 text-gold-500" />
          Rare {rareGot} ใบ
        </p>
      </section>

      {/* แถวชิปเลื่อนในกล่องตัวเอง ไม่ดันทั้งหน้าให้เลื่อนแนวนอน */}
      <div className="no-scrollbar -mx-4 mt-6 overflow-x-auto px-4">
        <ToggleGroup
          value={[canteen]}
          onValueChange={(v) => v[0] && setCanteen(v[0])}
          aria-label="กรองตามโรงอาหาร"
          className="w-max"
        >
          <ToggleGroupItem value="all" className={chip}>
            ทั้งหมด
          </ToggleGroupItem>
          {canteens.map((c) => (
            <ToggleGroupItem key={c.id} value={c.id} className={chip}>
              {c.short}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="mt-3 flex items-center gap-1 text-base">
        <span className="mr-1 text-muted-foreground">เรียงตาม</span>
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={sort === s.id}
            onClick={() => setSort(s.id)}
            className={cn(
              "min-h-11 rounded-full px-3 outline-none transition-colors duration-(--dur-fast) focus-visible:ring-[3px] focus-visible:ring-ring",
              sort === s.id ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <CardGrid items={items} />
      </div>

      {got === 0 ? (
        <div className="mt-8 rounded-card bg-card p-6 text-center shadow-card">
          <p className="font-heading text-xl font-bold">ยังไม่มีการ์ดเลย</p>
          <p className="mt-1 text-base text-muted-foreground">เปิดซองแรกแล้วเลือกเมนูที่จะไปกิน การ์ดใบนั้นจะมาอยู่ตรงนี้</p>
          <Link href="/" className={cn(buttonVariants(), "mt-4 h-12 px-6 text-base")}>
            ไปเปิดซอง
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <LinkShareButton
            path={`/c?d=${encodeCollection(entries)}`}
            title="คอลเลกชันการ์ดกินไรดีของฉัน"
            label="แชร์คอลเลกชันให้เพื่อน"
          />
          <p className="mt-2 text-center text-sm text-muted-foreground">ลิงก์เป็นภาพ ณ ตอนกดแชร์ ไม่อัปเดตตามทีหลัง</p>
        </div>
      )}
    </div>
  );
}

/** เงาของ layout จริง: การ์ดสรุป + แถวชิป + grid 3 คอลัมน์ */
function CollectionSkeleton() {
  return (
    <div aria-busy>
      <Skeleton className="h-36 rounded-card" />
      <div className="mt-6 flex gap-2">
        {[64, 72, 80, 64].map((w, i) => (
          <Skeleton key={i} className="h-10 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="mt-16 grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[5/7] rounded-[6%/4.3%]" />
        ))}
      </div>
    </div>
  );
}
