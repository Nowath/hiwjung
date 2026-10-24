import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Marquee, PopIn } from "@/components/Motion";
import { canteens, mainMenusOf, shops } from "@/lib/data";

export default function Home() {
  return (
    <>
      <TopBar />
      <main className="flex-1 pb-10">
        <PopIn>
          <section className="px-5 pt-6 pb-5">
            <p data-pop className="font-display inline-block -rotate-2 rounded-lg bg-sun px-2 py-0.5 text-sm font-semibold">
              หิวแล้วแต่คิดไม่ออก?
            </p>
            <h1 data-pop className="title-pop mt-3 text-[2.6rem]">
              มื้อนี้<span className="squiggle">กินไรดี</span>
              <br />
              <span className="text-pink">เปิดซอง</span>ลุ้นเลย!
            </h1>
            <p data-pop className="mt-3 max-w-[18rem] text-[15px] leading-relaxed text-ink/75">
              เลือกโรงอาหาร เปิดซองได้การ์ดเมนู 3 ใบ เลือกใบที่ใช่ แล้วเก็บสะสมให้ครบทุกร้าน
            </p>
          </section>
        </PopIn>

        <Marquee
          className="-rotate-1 bg-pink text-white"
          items={["มื้อละ 3 ซอง", "การ์ด Rare หายาก!", "สะสมให้ครบทุกร้าน", "แชร์ให้เพื่อนอิจฉา"]}
        />

        <PopIn delay={0.15}>
          <h2 data-pop className="font-display px-5 pt-8 pb-3 text-xl font-bold">
            เลือกโรงอาหาร 👇
          </h2>
          <ul className="grid grid-cols-2 gap-4 px-5">
            {canteens.map((c, i) => {
              const menuCount = mainMenusOf(c.id).length;
              const shopCount = shops.filter((s) => s.canteenId === c.id).length;
              return (
                <li key={c.id} data-pop>
                  <Link
                    href={`/${c.id}`}
                    className={`pop-box group block overflow-hidden transition-transform hover:-translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none ${i % 2 ? "rotate-[1.2deg]" : "-rotate-[1.2deg]"}`}
                    style={{ background: c.color }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden border-b-[2.5px] border-ink">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt={c.location} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="dots-bg grid h-full w-full place-items-center text-5xl">📺</div>
                      )}
                      <span className="font-display absolute top-2 left-2 rounded-full border-2 border-ink bg-white px-2 text-xs font-semibold">
                        {menuCount} การ์ด
                      </span>
                    </div>
                    <div className="px-3 py-2.5">
                      <div className="font-display text-lg leading-tight font-bold">{c.short}</div>
                      <div className="text-xs text-ink/70">{shopCount} ร้าน · {c.location}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </PopIn>

        <footer className="mt-10 px-5 text-[10px] leading-relaxed text-ink/50">
          เครดิตภาพอาคาร:{" "}
          {canteens
            .filter((c) => c.credit)
            .map((c) => `${c.short} — ${c.credit}`)
            .join(" · ")}
        </footer>
      </main>
    </>
  );
}
