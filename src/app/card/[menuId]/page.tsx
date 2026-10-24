import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { FoodCard } from "@/components/food-card";
import { PageShell } from "@/components/page-shell";
import { CardShareButtons } from "@/components/share-buttons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCanteen, getMenu, getShop, menus } from "@/lib/data";
import { cn } from "@/lib/utils";

export const instant = false;

export function generateStaticParams() {
  return menus.map((m) => ({ menuId: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/card/[menuId]">): Promise<Metadata> {
  const menu = getMenu((await params).menuId);
  if (!menu) return {};
  const title = `${menu.name} — การ์ด #${menu.id} | กินไรดี`;
  return {
    title,
    description: `${getCanteen(menu.canteenId)?.name} · ${menu.price} บาท`,
    // รูปการ์ดเป็น OG image ตรงๆ — ส่งใน LINE แล้วขึ้น preview เป็นการ์ดเลย
    openGraph: { title, images: [{ url: menu.image, width: 750, height: 1050 }] },
  };
}

export default async function CardPage({ params }: PageProps<"/card/[menuId]">) {
  const menu = getMenu((await params).menuId);
  if (!menu) notFound();
  const canteen = getCanteen(menu.canteenId);

  return (
    <PageShell>
      <AppHeader back="/collection" title={`การ์ด #${menu.id}`} />

      <div className="rise mx-auto w-full max-w-[280px] pt-2">
        <FoodCard menu={menu} priority sizes="280px" className="shadow-float" />
      </div>

      <section className="rise mt-6 rounded-card bg-card p-4 shadow-card [animation-delay:80ms]">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold">{menu.name}</h1>
          {menu.rarity === "rare" && (
            <Badge className="h-7 shrink-0 bg-gold-300/40 px-2.5 text-sm text-ink-900">
              <Sparkles data-icon="inline-start" />
              Rare
            </Badge>
          )}
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-base">
          <div>
            <dt className="text-muted-foreground">โรงอาหาร</dt>
            <dd className="font-bold">{canteen?.short}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">ร้าน</dt>
            <dd className="font-bold">{getShop(menu.shopId)?.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">ราคา</dt>
            <dd className="font-bold">{menu.price} บาท</dd>
          </div>
        </dl>
      </section>

      <CardShareButtons menu={menu} className="mt-4 grid grid-cols-2 gap-3" />
      <Link href="/" className={cn(buttonVariants(), "mt-3 h-12 text-base")}>
        เปิดซองของฉันบ้าง
      </Link>
    </PageShell>
  );
}
