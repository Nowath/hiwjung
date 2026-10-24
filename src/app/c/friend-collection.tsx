"use client";

import { useSearchParams } from "next/navigation";
import { CardGrid } from "@/components/card-grid";
import { menus } from "@/lib/data";
import { decodeCollection } from "@/lib/share";

export function FriendCollection() {
  const cards = decodeCollection(useSearchParams().get("d") ?? "").sort((a, b) =>
    a.menu.rarity === b.menu.rarity ? a.menu.id.localeCompare(b.menu.id) : a.menu.rarity === "rare" ? -1 : 1,
  );

  if (!cards.length) {
    return (
      <div className="rounded-card bg-card p-6 text-center shadow-card">
        <p className="font-heading text-xl font-bold">เปิดลิงก์นี้ไม่ได้</p>
        <p className="mt-1 text-base text-muted-foreground">ลิงก์อาจไม่ครบหรือไม่มีการ์ดอยู่ในนั้น ลองขอลิงก์ใหม่จากเพื่อน</p>
      </div>
    );
  }

  return (
    <div className="rise">
      <section className="rounded-card bg-card p-4 shadow-card">
        <p className="text-base text-muted-foreground">เพื่อนเก็บไปแล้ว (ภาพ ณ ตอนแชร์)</p>
        <p className="font-heading text-4xl font-bold">
          {cards.length} <span className="text-2xl text-muted-foreground">/ {menus.length} เมนู</span>
        </p>
      </section>
      <div className="mt-6">
        <CardGrid items={cards} />
      </div>
    </div>
  );
}
