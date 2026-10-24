import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { CollectionView } from "./collection-view";

export const metadata = { title: "คอลเลกชันของฉัน — กินไรดี" };

export default function CollectionPage() {
  return (
    <PageShell>
      <AppHeader back="/" title="คอลเลกชันของฉัน" />
      <CollectionView />
    </PageShell>
  );
}
