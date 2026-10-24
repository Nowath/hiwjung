import Link from "next/link";
import { CardSilhouette, FoodCard } from "@/components/food-card";
import type { Menu } from "@/lib/types";

export type GridItem = { menu: Menu; count: number };

/** grid 3 คอลัมน์ของการ์ด ใช้ทั้งคอลเลกชันของตัวเองและของเพื่อน — count 0 = ยังไม่ได้ (แสดงเงา) */
export function CardGrid({ items }: { items: GridItem[] }) {
  return (
    <ul className="grid grid-cols-3 gap-3">
      {items.map(({ menu, count }) => (
        <li key={menu.id} className="relative">
          {count > 0 ? (
            <Link
              href={`/card/${menu.id}`}
              className="block rounded-[6%/4.3%] outline-none transition-transform duration-(--dur-fast) ease-(--ease-out) hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <FoodCard menu={menu} />
            </Link>
          ) : (
            <CardSilhouette id={menu.id} />
          )}
          {count > 1 && (
            <span className="absolute -top-2 -right-2 grid h-7 min-w-7 place-items-center rounded-full bg-primary px-1.5 text-sm font-bold text-primary-foreground shadow-float">
              x{count}
            </span>
          )}
          <p className="mt-1 truncate text-center text-sm text-muted-foreground">#{menu.id}</p>
        </li>
      ))}
    </ul>
  );
}
