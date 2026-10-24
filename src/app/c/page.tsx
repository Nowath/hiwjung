import { Suspense } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FriendCollection } from "./friend-collection";

export const metadata = { title: "คอลเลกชันของเพื่อน — กินไรดี" };

export default function SharedCollectionPage() {
  return (
    <PageShell>
      <AppHeader back="/" title="คอลเลกชันของเพื่อน" />
      {/* อ่าน ?d= จาก URL ฝั่ง client — Suspense ให้ shell ของหน้า prerender ได้ */}
      <Suspense
        fallback={
          <div aria-busy>
            <Skeleton className="h-24 rounded-card" />
            <div className="mt-6 grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[5/7] rounded-[6%/4.3%]" />
              ))}
            </div>
          </div>
        }
      >
        <FriendCollection />
      </Suspense>
      <Link href="/" className={cn(buttonVariants(), "mt-8 h-12 text-base")}>
        เปิดซองของฉันบ้าง
      </Link>
    </PageShell>
  );
}
