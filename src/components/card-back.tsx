import { APP_NAME } from "@/config/flow";
import { cn } from "@/lib/utils";

/** หลังการ์ดใช้แบบเดียวทุกใบ — วาดด้วย CSS เพราะยังไม่มีไฟล์ back.png จากดีไซเนอร์ */
export function CardBack({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "@container relative grid aspect-[5/7] place-items-center overflow-hidden rounded-[6%/4.3%] bg-rose-500",
        "ring-[6px] ring-inset ring-white/85",
        className,
      )}
    >
      {/* ลายเฉียงจางๆ ให้หลังการ์ดดูเป็นวัสดุพิมพ์ ไม่ใช่สีเรียบ */}
      <span
        aria-hidden
        className="absolute inset-0 opacity-25"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, white 0 2px, transparent 2px 14px)" }}
      />
      <span className="relative grid aspect-square w-3/5 place-items-center rounded-full bg-white shadow-float">
        <span className="font-heading text-[clamp(1rem,12cqw,2.25rem)] font-bold text-rose-500">{APP_NAME}</span>
      </span>
    </div>
  );
}
