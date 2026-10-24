import { AppHeader } from "@/components/app-header";
import { CanteenTile } from "@/components/canteen-tile";
import { CollectionLink } from "@/components/collection-link";
import { CollectionProgress } from "@/components/collection-progress";
import { PacksLeft } from "@/components/packs-left";
import { PageShell } from "@/components/page-shell";
import { canteens, packPoolOf } from "@/lib/data";

export default function HomePage() {
  return (
    <PageShell>
      <AppHeader
        right={
          <>
            <PacksLeft />
            <CollectionLink />
          </>
        }
      />

      <section className="rise pt-4 pb-6">
        <h1 className="font-heading text-[clamp(2rem,9vw,2.5rem)] font-bold">วันนี้กินที่ไหนดี</h1>
        <p className="mt-1 text-lg text-muted-foreground">
          เลือกโรงอาหาร เปิดซองสุ่มเมนู 3 ใบ แล้วเก็บใบที่จะไปกินเข้าคอลเลกชัน
        </p>
      </section>

      <div className="rise [animation-delay:80ms]">
        <CollectionProgress />
      </div>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold">โรงอาหาร</h2>
      <ul className="grid gap-4">
        {canteens.map((c, i) => (
          <li key={c.id} className="rise" style={{ animationDelay: `${160 + i * 80}ms` }}>
            <CanteenTile canteen={c} menuCount={packPoolOf(c.id).length} priority={i === 0} />
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-ink-400">
        ภาพโรงอาหาร: {canteens.flatMap((c) => (c.credit ? [c.credit] : [])).join(" · ")}
      </p>
    </PageShell>
  );
}
