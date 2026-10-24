import type { CollectionEntry, Menu } from "./types";
import { getMenu } from "./data";

// ---- collection link: "001:2,007:1" → base64url ----

export function encodeCollection(entries: CollectionEntry[]) {
  const raw = entries.map((e) => `${e.menuId}:${e.count}`).join(",");
  const b64 = btoa(unescape(encodeURIComponent(raw)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCollection(d: string): { menu: Menu; count: number }[] {
  try {
    const b64 = d.replace(/-/g, "+").replace(/_/g, "/");
    const raw = decodeURIComponent(escape(atob(b64)));
    return raw
      .split(",")
      .map((pair) => {
        const [id, count] = pair.split(":");
        const menu = getMenu(id);
        const n = Number(count);
        return menu && n > 0 ? { menu, count: Math.min(n, 999) } : null;
      })
      .filter((x): x is { menu: Menu; count: number } => x !== null);
  } catch {
    return [];
  }
}

// ---- share helpers ----

async function cardPngFile(menu: Menu) {
  const img = new Image();
  img.src = menu.image;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"),
  );
  return new File([blob], `kinraidee-${menu.id}.png`, { type: "image/png" });
}

/** Share the card image via the native share sheet, or download it as a fallback. */
export async function shareCardImage(menu: Menu) {
  const file = await cardPngFile(menu);
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: menu.name, text: `วันนี้ได้การ์ด ${menu.name} 🍛` });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return "downloaded";
}

/** Share a URL via the share sheet, or copy it to the clipboard. */
export async function shareLink(url: string, title: string) {
  if (navigator.share) {
    try {
      await navigator.share({ url, title });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
