"use client";

import { useState } from "react";
import type { Menu } from "@/lib/types";
import { shareCardImage, shareLink } from "@/lib/share";

export function CardShareButtons({ menu }: { menu: Menu }) {
  const [msg, setMsg] = useState("");
  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={async () => {
            const r = await shareCardImage(menu);
            if (r === "downloaded") flash("บันทึกรูปการ์ดแล้ว ✓");
          }}
          className="btn bg-white text-sm"
        >
          📷 แชร์รูป
        </button>
        <button
          onClick={async () => {
            const r = await shareLink(`${location.origin}/card/${menu.id}`, menu.name);
            if (r === "copied") flash("คัดลอกลิงก์แล้ว ✓");
          }}
          className="btn bg-white text-sm"
        >
          🔗 แชร์ลิงก์
        </button>
      </div>
      <p className="font-display h-4 text-center text-xs font-semibold text-pink">{msg}</p>
    </div>
  );
}
