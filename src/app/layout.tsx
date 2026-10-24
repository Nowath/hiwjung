import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME } from "@/config/flow";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: `${APP_NAME} — สุ่มการ์ดอาหารโรงอาหารจุฬาฯ`,
  description: "เลือกโรงอาหาร เปิดซองสุ่มเมนู 3 ใบ แล้วเก็บใบที่จะไปกินเข้าคอลเลกชัน",
};

export const viewport: Viewport = {
  themeColor: "#f2f2f2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="antialiased">
      <body className="flex min-h-dvh flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
