"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FoodCard } from "@/components/FoodCard";
import { decodeCollection } from "@/lib/share";
import { menus } from "@/lib/data";

function FriendCollection() {
  const cards = decodeCollection(useSearchParams().get("d") ?? "");
  cards.sort((a, b) => (a.menu.rarity === b.menu.rarity ? a.menu.id.localeCompare(b.menu.id) : a.menu.rarity === "rare" ? -1 : 1));

  return (
    <>
      <section className="py-6">
        <p className="text-sm text-ink/60">คอลเลกชันของเพื่อน (snapshot)</p>
        <h1 className="title-pop text-3xl">
          เก็บไปแล้ว <span className="text-pink">{cards.length}</span> / {menus.length} เมนู
        </h1>
      </section>
      {cards.length ? (
        <ul className="grid grid-cols-3 gap-3">
          {cards.map(({ menu, count }) => (
            <li key={menu.id} className="relative">
              <Link href={`/card/${menu.id}`}>
                <FoodCard menu={menu} tilt={false} />
              </Link>
              {count > 1 && (
                <span className="absolute -right-1.5 -top-1.5 font-display rotate-12 rounded-full border-2 border-ink bg-sun px-2 text-xs font-bold">
                  x{count}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink/60">ลิงก์นี้ไม่มีการ์ด หรือลิงก์เสีย</p>
      )}
    </>
  );
}

export default function SharedCollectionPage() {
  return (
    <main className="flex flex-1 flex-col px-4 pb-10">
      <Suspense fallback={<p className="py-6 text-ink/60">กำลังโหลด…</p>}>
        <FriendCollection />
      </Suspense>
      <Link
        href="/"
        className="mx-auto mt-10 btn bg-sun !px-6 !py-3"
      >
        เปิดซองของฉันบ้าง
      </Link>
    </main>
  );
}
