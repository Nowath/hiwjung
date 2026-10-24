import canteensJson from "@/data/canteens.json";
import shopsJson from "@/data/shops.json";
import menusJson from "@/data/menus.json";
import type { Canteen, Menu, Shop } from "./types";

export const canteens = canteensJson as Canteen[];
export const shops = shopsJson as Shop[];
export const menus = menusJson as Menu[];

export const getCanteen = (id: string) => canteens.find((c) => c.id === id);
export const getShop = (id: string) => shops.find((s) => s.id === id);
export const getMenu = (id: string) => menus.find((m) => m.id === id);

export const mainMenusOf = (canteenId: string) =>
  menus.filter((m) => m.canteenId === canteenId && m.type === "main");
