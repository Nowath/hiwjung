import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { APP_NAME } from "@/config/flow";

/** header บางแบบ cunex: ปุ่มย้อนกลับ (หรือโลโก้ที่หน้าแรก) ซ้าย, action ขวา */
export function AppHeader({ back, title, right }: { back?: string; title?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-2 flex h-16 items-center gap-2 bg-background/90 px-4 backdrop-blur-sm">
      {back ? (
        <Link
          href={back}
          aria-label="ย้อนกลับ"
          className="-ml-2 grid size-11 place-items-center rounded-full outline-none transition-colors duration-(--dur-fast) hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <ChevronLeft className="size-6" />
        </Link>
      ) : (
        <Link href="/" className="rounded-md font-heading text-2xl font-bold text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
          {APP_NAME}
        </Link>
      )}
      {title && <p className="truncate font-heading text-lg font-bold">{title}</p>}
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </header>
  );
}
