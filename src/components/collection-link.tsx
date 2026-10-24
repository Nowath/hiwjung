import Link from "next/link";
import { LibraryBig } from "lucide-react";

export function CollectionLink() {
  return (
    <Link
      href="/collection"
      aria-label="คอลเลกชันของฉัน"
      className="grid size-11 place-items-center rounded-full bg-card shadow-card outline-none transition-colors duration-(--dur-fast) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring"
    >
      <LibraryBig className="size-5" />
    </Link>
  );
}
