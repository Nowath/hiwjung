import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FoodCard } from "@/components/FoodCard";
import { getCanteen, getMenu, getShop, menus } from "@/lib/data";

// every path is prerendered from generateStaticParams; nothing to stream
export const instant = false;

export function generateStaticParams() {
  return menus.map((m) => ({ menuId: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/card/[menuId]">): Promise<Metadata> {
  const menu = getMenu((await params).menuId);
  if (!menu) return {};
  const canteen = getCanteen(menu.canteenId);
  const title = `${menu.name} — การ์ด #${menu.id} | กินไรดี`;
  return {
    title,
    description: `${canteen?.name} · ${menu.price} บาท`,
    openGraph: { title, images: [{ url: menu.image, width: 750, height: 1050 }] },
  };
}

export default async function CardPage({ params }: PageProps<"/card/[menuId]">) {
  const menu = getMenu((await params).menuId);
  if (!menu) notFound();
  const canteen = getCanteen(menu.canteenId);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10">
      <p className="text-sm text-ink/60">เพื่อนแชร์การ์ดนี้มาให้</p>
      <div className="w-full max-w-[300px]">
        <FoodCard menu={menu} priority />
      </div>
      <div className="text-center">
        <h1 className="title-pop text-2xl">{menu.name}</h1>
        <p className="text-sm text-ink/60">
          {canteen?.name} · {getShop(menu.shopId)?.name} · {menu.price}฿
          {menu.rarity === "rare" && <span className="ml-2 text-pink">★ RARE</span>}
        </p>
      </div>
      <Link href="/" className="btn bg-sun !px-6 !py-3">
        เปิดซองของฉันบ้าง
      </Link>
    </main>
  );
}
