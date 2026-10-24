import { menus, mainMenusOf } from "./data";
import type { Menu, Rarity } from "./types";

export const CARDS_PER_PACK = 3;
export const RARE_CHANCE = 0.2;

const pickRandom = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function drawFrom(pool: Menu[], taken: Set<string>): Menu | undefined {
  const rarity: Rarity = Math.random() < RARE_CHANCE ? "rare" : "common";
  const left = pool.filter((m) => !taken.has(m.id));
  const sameRarity = left.filter((m) => m.rarity === rarity);
  // no menu of the rolled rarity left → fall back to the other one
  return pickRandom(sameRarity.length ? sameRarity : left);
}

/**
 * Draws a pack: no duplicates inside one pack. If the canteen has fewer menus
 * than CARDS_PER_PACK, the pack is topped up with main dishes from other canteens.
 * Returned in reveal order: commons first, rares last (TCG Pocket style).
 */
export function drawPack(canteenId: string): Menu[] {
  const taken = new Set<string>();
  const cards: Menu[] = [];
  const local = mainMenusOf(canteenId);
  const everywhere = menus.filter((m) => m.type === "main");

  for (let i = 0; i < CARDS_PER_PACK; i++) {
    const pool = local.some((m) => !taken.has(m.id)) ? local : everywhere;
    const card = drawFrom(pool, taken);
    if (!card) break;
    taken.add(card.id);
    cards.push(card);
  }
  return cards.sort((a, b) => Number(a.rarity === "rare") - Number(b.rarity === "rare"));
}
