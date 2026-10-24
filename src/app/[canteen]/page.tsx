import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { PopIn } from "@/components/Motion";
import { canteens, getCanteen } from "@/lib/data";

// every path is prerendered from generateStaticParams; nothing to stream
export const instant = false;

export function generateStaticParams() {
  return canteens.map((c) => ({ canteen: c.id }));
}

const TYPES = [
  { id: "main", label: "อาหารจานหลัก", sub: "ข้าว เส้น กับข้าว", emoji: "🍛", bg: "bg-sun", enabled: true },
  { id: "dessert", label: "ของหวาน", sub: "เร็วๆ นี้", emoji: "🍧", bg: "bg-pink-soft", enabled: false },
  { id: "drink", label: "เครื่องดื่ม", sub: "เร็วๆ นี้", emoji: "🧋", bg: "bg-aqua", enabled: false },
];

export default async function CanteenPage({ params }: PageProps<"/[canteen]">) {
  const { canteen: id } = await params;
  const canteen = getCanteen(id);
  if (!canteen) notFound();

  return (
    <>
      <TopBar back="/" />
      <main className="flex-1 px-5 pb-10">
        <PopIn>
          <div data-pop className="pop-box relative mt-3 overflow-hidden" style={{ background: canteen.color }}>
            {canteen.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={canteen.image} alt={canteen.location} className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="dots-bg grid aspect-[16/9] place-items-center text-6xl">📺</div>
            )}
            <span className="font-display absolute bottom-3 left-3 -rotate-2 rounded-xl border-[2.5px] border-ink bg-white px-3 py-1 text-lg font-bold shadow-[3px_3px_0_0_var(--ink)]">
              {canteen.name}
            </span>
          </div>

          <h1 data-pop className="title-pop mt-7 text-3xl">
            อยากกิน<span className="text-pink">แบบไหน</span>?
          </h1>

          <ul className="mt-5 grid gap-4">
            {TYPES.map((t) => {
              const inner = (
                <>
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-[2.5px] border-ink bg-white text-3xl">
                    {t.emoji}
                  </span>
                  <span>
                    <span className="font-display block text-xl font-bold">{t.label}</span>
                    <span className="text-sm text-ink/70">{t.sub}</span>
                  </span>
                </>
              );
              return (
                <li key={t.id} data-pop>
                  {t.enabled ? (
                    <Link
                      href={`/${canteen.id}/quiz`}
                      className={`pop-box flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none ${t.bg}`}
                    >
                      {inner}
                      <span className="font-display ml-auto text-3xl">→</span>
                    </Link>
                  ) : (
                    <div className={`flex items-center gap-4 rounded-[22px] border-[2.5px] border-dashed border-ink/40 p-4 opacity-60 ${t.bg}`}>
                      {inner}
                      <span className="font-display ml-auto rotate-6 rounded-full border-2 border-ink bg-white px-2 py-0.5 text-xs font-semibold">
                        🔒 เร็วๆ นี้
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </PopIn>
      </main>
    </>
  );
}
