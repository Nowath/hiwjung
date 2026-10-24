import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** คอลัมน์มือถือที่ทุกหน้าปกติใช้ร่วมกัน — จอใหญ่แค่จัดกลาง ไม่ได้ออกแบบ desktop แยก */
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-12", className)}>{children}</main>;
}
