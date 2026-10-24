export type Rarity = "common" | "rare";
export type MealType = "main" | "dessert" | "drink";

export interface Canteen {
  id: string;
  name: string;
  short: string;
  location: string;
  color: string; // pastel tile colour
  image: string | null; // faculty photo; null → illustrated tile
  credit: string | null; // photo attribution (CC licences require it)
}

export interface Shop {
  id: string;
  canteenId: string;
  name: string;
}

export interface Menu {
  id: string; // also the card number
  shopId: string;
  canteenId: string;
  name: string;
  type: MealType;
  price: number;
  rarity: Rarity;
  image: string;
  spicy: 0 | 1 | 2 | 3; // for future filtering (info is already printed on the card)
  tags: string[];
}

export interface CollectionEntry {
  menuId: string;
  count: number;
  firstAt: string;
  lastAt: string;
}

export interface PackUsage {
  mealSlot: string; // e.g. "2026-10-24:lunch"
  opened: number;
}
