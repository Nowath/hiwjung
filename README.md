# กินไรดี 🍛

เว็บสุ่มเมนูอาหารในโรงอาหารจุฬาฯ แบบ **เปิดซองการ์ด TCG** — เลือกโรงอาหาร ตอบคำถามสั้นๆ แล้วฉีกซองลุ้นการ์ดเมนู 3 ใบ เลือกใบที่จะไปกินจริง 1 ใบเก็บเข้า collection และแชร์ให้เพื่อนดูได้

> Side project / prototype — **ไม่มี backend ไม่มี login** ข้อมูลทั้งหมดอยู่ใน frontend และเก็บ collection ไว้ในเครื่องผู้ใช้ (localStorage)

## Features

- **เปิดซองแบบจัดเต็ม** — ลากฉีกซอง การ์ดกระจายออกมา ปัดดูทีละใบ การ์ด Rare มีเอฟเฟกต์ทองและเสียงพิเศษ (GSAP + เสียงสังเคราะห์ด้วย Web Audio API ไม่มีไฟล์เสียง)
- **ซองละ 3 ใบ เลือกเก็บ 1** — ใบที่ไม่เลือกจะไม่ถูกเก็บ
- **Rarity 2 ระดับ** — Common / Rare (โอกาส Rare 20% ต่อช่อง) ในซองเดียวไม่มีเมนูซ้ำ และเปิด Rare เป็นใบสุดท้ายเสมอ
- **จำกัดซองต่อมื้อ** — มื้อละ 3 ซอง (เช้า / กลางวัน / เย็น / ดึก) หมดแล้วแสดง countdown ไปมื้อถัดไป
- **Collection** — นับใบซ้ำ แสดงความคืบหน้า และช่องเงาของใบที่ยังไม่มี
- **แชร์** — ส่งรูปการ์ดผ่าน share sheet ของมือถือ (หรือดาวน์โหลด), ลิงก์การ์ดใบเดียวพร้อม OG image, และลิงก์ collection แบบ snapshot
- **Quiz (mock)** — คำถาม 5 ข้อ เก็บคำตอบไว้แล้วแต่ยังไม่ได้ใช้กรองเมนู
- ประเภทอาหารเปิดแค่ **จานหลัก** ส่วนของหวาน / เครื่องดื่มขึ้นป้าย "เร็วๆ นี้"

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (Base UI)
- zustand + `persist` → localStorage
- GSAP (Draggable, Physics2D, CustomEase ฯลฯ) สำหรับ animation เปิดซอง
- sharp (dev) สำหรับแปลงรูปการ์ด
- ฟอนต์ CHULALONGKORN / Chula Charas New / TH Sarabun Chula

## เริ่มต้นใช้งาน

```bash
bun install        # หรือ npm install
bun dev            # หรือ npm run dev
```

เปิด <http://localhost:3000>

| คำสั่ง | ทำอะไร |
| --- | --- |
| `dev` | รัน dev server |
| `build` | build production |
| `start` | รัน production build |
| `lint` | ESLint |

## หน้าในเว็บ

```
/                     เลือกโรงอาหาร
/[canteen]            เลือกประเภทอาหาร (จานหลัก / ของหวาน 🔒 / เครื่องดื่ม 🔒)
/[canteen]/quiz       คำถาม mock
/[canteen]/open       เปิดซอง → เลือก 1 ใบ → เก็บเข้า collection
/collection           การ์ดที่เก็บไว้ทั้งหมด + ปุ่มแชร์
/card/[menuId]        หน้าการ์ดใบเดียว (ลิงก์แชร์ มี OG image)
/c?d=<encoded>        collection ของเพื่อนแบบอ่านอย่างเดียว
```

ทุก route prerender แบบ static ผ่าน `generateStaticParams`

## โครงสร้างโปรเจกต์

```
src/
├── app/
│   ├── [canteen]/open/   หน้าเปิดซอง
│   │   ├── director.ts   ลำดับ animation ทั้งหมด (state: ready → tearing → reveal → choose → saved)
│   │   ├── fx.ts         GSAP plugins + เอฟเฟกต์ (burst, sparkles, shake)
│   │   └── sfx.ts        เสียงสังเคราะห์ด้วย Web Audio API
│   ├── collection/  c/  card/[menuId]/
├── components/           FoodCard, CardBack, ShareButtons, PacksLeft ฯลฯ
├── config/flow.ts        ชื่อแอป ชื่อซอง ประเภทอาหาร และคำถาม quiz
├── data/                 canteens.json, shops.json, menus.json
└── lib/
    ├── pack.ts           logic สุ่มการ์ดในซอง
    ├── meal.ts           แบ่งมื้อ + จำนวนซองต่อมื้อ + countdown
    ├── share.ts          encode/decode ลิงก์ collection + แชร์รูป/ลิงก์
    ├── store.ts          zustand store (collection, ซองที่ใช้, คำตอบ quiz, ปิดเสียง)
    └── data.ts           helper อ่านข้อมูล + ตัวเลือก SHARED_POOL
scripts/convert-cards.mjs  แปลงรูปการ์ดจากดีไซเนอร์เป็น webp
```

## ปรับค่าได้ที่ไหน

| ค่า | ไฟล์ | ค่าเริ่มต้น |
| --- | --- | --- |
| จำนวนการ์ดต่อซอง `CARDS_PER_PACK` | `src/lib/pack.ts` | 3 |
| โอกาสได้ Rare ต่อช่อง `RARE_CHANCE` | `src/lib/pack.ts` | 0.2 |
| ซองต่อมื้อ `PACKS_PER_MEAL` | `src/lib/meal.ts` | 3 |
| เวลาเริ่มแต่ละมื้อ `SLOTS` | `src/lib/meal.ts` | 06:00 / 10:30 / 15:00 / 21:00 |
| สุ่มจากกองรวมทุกโรงอาหาร `SHARED_POOL` | `src/lib/data.ts` | `true` |
| ชื่อแอป / ชื่อซอง / คำถาม quiz | `src/config/flow.ts` | — |

> ตอนนี้มีการ์ดแค่ 8 ใบ จึงตั้ง `SHARED_POOL = true` ให้ทุกโรงอาหารสุ่มจากกองเดียวกัน เมื่อมีเมนูครบแต่ละโรงอาหารแล้วให้เปลี่ยนเป็น `false`

## เพิ่มเมนู / การ์ดใหม่

1. วางไฟล์รูปการ์ดจากดีไซเนอร์ (`1.png`, `2.png`, … ขนาด 1500×2100) ไว้ในโฟลเดอร์หนึ่ง แล้วรัน

   ```bash
   node scripts/convert-cards.mjs <โฟลเดอร์รูป>
   ```

   สคริปต์จะย่อเป็น 750×1050 แล้วบันทึกเป็น `public/cards/001.webp`, `002.webp`, …

2. เพิ่มเมนูใน `src/data/menus.json` ให้ `id` ตรงกับชื่อไฟล์การ์ด

   ```json
   {
     "id": "009",
     "shopId": "arts-4",
     "canteenId": "arts",
     "name": "ชื่อเมนู",
     "type": "main",
     "price": 50,
     "rarity": "common",
     "image": "/cards/009.webp",
     "spicy": 0,
     "tags": ["rice"]
   }
   ```

   `spicy` (0–3) และ `tags` ยังไม่ได้ใช้ แต่เตรียมไว้สำหรับกรองเมนูจาก quiz

3. ถ้าเป็นร้านใหม่ ให้เพิ่มใน `src/data/shops.json` ด้วย

## ข้อจำกัดของ prototype

- จำนวนซองนับใน localStorage จึงโกงได้ (ล้างข้อมูลเบราว์เซอร์ก็รีเซ็ต)
- collection อยู่ในเครื่องเดียว ไม่ซิงก์ข้ามอุปกรณ์
- ลิงก์ collection เป็น snapshot ตอนกดแชร์ ไม่อัปเดตตาม
- คำตอบ quiz ยังไม่ได้ใช้กรองเมนู
- หลังการ์ดวาดด้วย CSS ชั่วคราว รอไฟล์จากดีไซเนอร์

## Roadmap

- [ ] ใช้คำตอบ quiz กรองเมนูจริง (`price`, `spicy`, `tags`)
- [ ] เปิดหมวดของหวาน / เครื่องดื่ม
- [ ] เพิ่มเมนูให้ครบทุกโรงอาหาร แล้วปิด `SHARED_POOL`
- [ ] Login ด้วย Chula SSO + เก็บ collection ใน DB
- [ ] หน้า admin จัดการเมนู
- [ ] Achievement เช่น เก็บครบทุกร้านในโรงอาหาร

## Credits

รูปโรงอาหารจาก Wikimedia Commons (CC BY-SA) — ดูรายชื่อผู้ถ่ายได้ในช่อง `credit` ของ `src/data/canteens.json`
