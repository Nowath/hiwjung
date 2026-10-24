import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { canteens, getCanteen } from "@/lib/data";
import { Quiz } from "./quiz";

export const instant = false;

export function generateStaticParams() {
  return canteens.map((c) => ({ canteen: c.id }));
}

export default async function QuizPage({ params }: PageProps<"/[canteen]/quiz">) {
  const canteen = getCanteen((await params).canteen);
  if (!canteen) notFound();

  return (
    <PageShell>
      <AppHeader back={`/${canteen.id}`} title="ก่อนเปิดซอง" />
      <Quiz canteenId={canteen.id} />
    </PageShell>
  );
}
