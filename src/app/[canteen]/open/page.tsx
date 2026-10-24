import { notFound } from "next/navigation";
import { canteens, getCanteen } from "@/lib/data";
import { PackStage } from "./pack-stage";

export const instant = false;

export function generateStaticParams() {
  return canteens.map((c) => ({ canteen: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/[canteen]/open">) {
  return { title: `เปิดซอง · ${getCanteen((await params).canteen)?.short ?? ""} — กินไรดี` };
}

export default async function OpenPage({ params }: PageProps<"/[canteen]/open">) {
  const canteen = getCanteen((await params).canteen);
  if (!canteen) notFound();
  return <PackStage canteen={canteen} />;
}
