import Image from "next/image";
import Link from "next/link";
import { ChevronRight, UtensilsCrossed } from "lucide-react";
import type { Canteen } from "@/lib/types";

export function CanteenTile({ canteen, menuCount, priority }: { canteen: Canteen; menuCount: number; priority?: boolean }) {
  return (
    <Link
      href={`/${canteen.id}`}
      className="group block overflow-hidden rounded-card bg-card shadow-card outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        {canteen.image ? (
          <Image
            src={canteen.image}
            alt={canteen.location}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            priority={priority}
            className="object-cover transition-transform duration-(--dur-slow) ease-(--ease-out) group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <UtensilsCrossed className="size-12 text-rose-300" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-xl font-bold">{canteen.name}</h2>
          <p className="text-base text-muted-foreground">
            {canteen.location} · {menuCount} เมนู
          </p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors duration-(--dur-fast) group-hover:bg-primary group-hover:text-primary-foreground">
          <ChevronRight className="size-5" />
        </span>
      </div>
    </Link>
  );
}
