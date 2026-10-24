import { notFound } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { canteens, getCanteen } from "@/lib/data";
import { PackFlow } from "./PackOpener";

// every path is prerendered from generateStaticParams; nothing to stream
export const instant = false;

export function generateStaticParams() {
  return canteens.map((c) => ({ canteen: c.id }));
}

export default async function OpenPage({ params }: PageProps<"/[canteen]/open">) {
  const { canteen: id } = await params;
  const canteen = getCanteen(id);
  if (!canteen) notFound();

  return (
    <>
      <TopBar back={`/${id}`} />
      <PackFlow canteen={canteen} />
    </>
  );
}
