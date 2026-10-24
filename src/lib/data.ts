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

// ช่วงนี้การ์ดยังน้อย (8 ใบ) — ทุกโรงอาหารสุ่มจากกองเดียวกันทั้งหมด
// มีเมนูครบแต่ละโรงอาหารเมื่อไหร่ ตั้งเป็น false แล้วซองจะสุ่มเฉพาะเมนูของโรงอาหารนั้น
export const SHARED_POOL = true;

/** เมนูที่ซองของโรงอาหารนี้สุ่มได้ */
export const packPoolOf = (canteenId: string) =>
  SHARED_POOL ? menus.filter((m) => m.type === "main") : mainMenusOf(canteenId);
