"use client";

import { useState } from "react";
import { ImageDown, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { shareCardImage, shareLink } from "@/lib/share";
import type { Menu } from "@/lib/types";

const RESULT_TOAST: Record<string, string | null> = {
  shared: null,
  cancelled: null,
  downloaded: "บันทึกรูปการ์ดแล้ว",
  copied: "คัดลอกลิงก์แล้ว",
};

/** แชร์การ์ดใบเดียว: รูป PNG ผ่าน share sheet (ไม่รองรับ → ดาวน์โหลด) และลิงก์ /card/[id] */
export function CardShareButtons({ menu, className, tone = "light" }: { menu: Menu; className?: string; tone?: "light" | "dark" }) {
  const [busy, setBusy] = useState(false);
  // บนเวทีมืดใช้ปุ่มโปร่งขาวแทน outline ที่พื้นสว่าง
  const btn = tone === "dark" ? "h-12 border-white/20 bg-white/10 text-base text-stage-fg hover:bg-white/15" : "h-12 text-base";

  async function run(fn: () => Promise<string>) {
    setBusy(true);
    try {
      const msg = RESULT_TOAST[await fn()];
      if (msg) toast.success(msg);
    } catch {
      toast.error("แชร์ไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className ?? "grid grid-cols-2 gap-3"}>
      <Button variant="outline" className={btn} disabled={busy} onClick={() => run(() => shareCardImage(menu))}>
        <ImageDown data-icon="inline-start" />
        แชร์รูปการ์ด
      </Button>
      <Button
        variant="outline"
        className={btn}
        disabled={busy}
        onClick={() => run(() => shareLink(`${location.origin}/card/${menu.id}`, menu.name))}
      >
        <Link2 data-icon="inline-start" />
        แชร์ลิงก์
      </Button>
    </div>
  );
}

export function LinkShareButton({ path, title, label }: { path: string; title: string; label: string }) {
  async function onClick() {
    try {
      const msg = RESULT_TOAST[await shareLink(`${location.origin}${path}`, title)];
      if (msg) toast.success(msg);
    } catch {
      toast.error("แชร์ไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  }
  return (
    <Button className="h-12 w-full text-base" onClick={onClick}>
      <Link2 data-icon="inline-start" />
      {label}
    </Button>
  );
}
