import { notFound } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { canteens, getCanteen } from "@/lib/data";
import { Quiz } from "./Quiz";

// every path is prerendered from generateStaticParams; nothing to stream
export const instant = false;

export function generateStaticParams() {
  return canteens.map((c) => ({ canteen: c.id }));
}

export default async function QuizPage({ params }: PageProps<"/[canteen]/quiz">) {
  const { canteen: id } = await params;
  if (!getCanteen(id)) notFound();

  return (
    <>
      <TopBar back={`/${id}`} />
      <Quiz canteenId={id} />
    </>
  );
}
