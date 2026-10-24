import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CupSoda, IceCreamCone, Lock, Soup } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PacksLeft } from "@/components/packs-left";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { MEAL_TYPES } from "@/config/flow";
import { canteens, getCanteen } from "@/lib/data";
import { cn } from "@/lib/utils";

// ทุก path prerender จาก generateStaticParams แล้ว ไม่มีอะไรต้อง stream
export const instant = false;

export function generateStaticParams() {
  return canteens.map((c) => ({ canteen: c.id }));
}

const ICONS = { main: Soup, dessert: IceCreamCone, drink: CupSoda };

export default async function CanteenPage({ params }: PageProps<"/[canteen]">) {
  const canteen = getCanteen((await params).canteen);
  if (!canteen) notFound();

  return (
    <PageShell>
      <AppHeader back="/" title={canteen.name} right={<PacksLeft />} />

      <section className="rise flex items-center gap-4 pt-2 pb-6">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-card bg-secondary">
          {canteen.image && <Image src={canteen.image} alt="" fill sizes="64px" className="object-cover" />}
        </div>
        <div>
          <p className="text-base text-muted-foreground">{canteen.location}</p>
          <h1 className="font-heading text-3xl font-bold">อยากกินแบบไหน</h1>
        </div>
      </section>

      <ul className="grid gap-3">
        {MEAL_TYPES.map((t, i) => {
          const Icon = ICONS[t.id];
          const body = (
            <>
              <span
                className={cn(
                  "grid size-14 shrink-0 place-items-center rounded-xl",
                  t.enabled ? "bg-secondary text-primary" : "bg-badge text-ink-400",
                )}
              >
                <Icon className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-xl font-bold">{t.label}</span>
                <span className="block text-base text-muted-foreground">{t.hint}</span>
              </span>
            </>
          );
          return (
            <li key={t.id} className="rise" style={{ animationDelay: `${80 + i * 80}ms` }}>
              {t.enabled ? (
                <Link
                  href={`/${canteen.id}/quiz`}
                  className="group flex items-center gap-4 rounded-card bg-card p-4 shadow-card outline-none transition-colors duration-(--dur-fast) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  {body}
                  <ChevronRight className="size-5 text-muted-foreground transition-transform duration-(--dur-fast) group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <div aria-disabled className="flex items-center gap-4 rounded-card bg-card/60 p-4">
                  {body}
                  <Badge variant="disable" className="h-7 px-2.5 text-sm">
                    <Lock data-icon="inline-start" />
                    เร็วๆ นี้
                  </Badge>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
