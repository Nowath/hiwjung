import type { Metadata, Viewport } from "next";
import { Anuphan, Mitr } from "next/font/google";
import "./globals.css";

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
});

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: "กินไรดี — สุ่มการ์ดอาหารโรงอาหารจุฬาฯ",
  description: "เปิดซองการ์ดอาหาร สุ่มเมนูโรงอาหารจุฬาฯ แล้วสะสมให้ครบ",
};

export const viewport: Viewport = {
  themeColor: "#fff6eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${mitr.variable} ${anuphan.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
