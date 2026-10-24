import type { MealType } from "@/lib/types";

export const APP_NAME = "กินไรดี";
export const PACK_NAME = "ซองข้าวจานหลัก";

export const MEAL_TYPES: {
  id: MealType;
  label: string;
  hint: string;
  enabled: boolean;
}[] = [
  { id: "main", label: "อาหารจานหลัก", hint: "ข้าว เส้น กับข้าว", enabled: true },
  { id: "dessert", label: "ของหวาน", hint: "เร็วๆ นี้", enabled: false },
  { id: "drink", label: "เครื่องดื่ม", hint: "เร็วๆ นี้", enabled: false },
];

// คำถามเป็น mock — เก็บคำตอบไว้ใน store แต่ยังไม่เอาไป filter (ดูแผนใน vault)
// multi = เลือกได้หลายข้อ (มีปุ่มถัดไป) · exclusive = ตัวเลือกที่เลือกแล้วล้างตัวอื่น เช่น "อะไรก็ได้"
export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  multi?: boolean;
  exclusive?: string;
};

export const QUIZ: QuizQuestion[] = [
  { id: "style", question: "อยากกินอาหารสไตล์ไหน", options: ["ไทย", "ญี่ปุ่น", "เกาหลี", "จีน", "ตะวันตก", "อะไรก็ได้"] },
  { id: "meal", question: "มื้อนี้มื้อไหน", options: ["มื้อเช้า", "มื้อกลางวัน", "มื้อเย็น"] },
  {
    id: "avoid",
    question: "มีอะไรที่ไม่กินไหม",
    options: ["เผ็ด", "ซีฟู้ด", "เนื้อวัว", "หมู", "ผัก", "กินได้หมด"],
    multi: true,
    exclusive: "กินได้หมด",
  },
  {
    id: "craving",
    question: "อยากกินอะไรเป็นพิเศษ",
    options: ["เส้น", "ข้าว", "สเต็ก", "ของทอด", "ต้ม / แกง", "อะไรก็ได้"],
    multi: true,
    exclusive: "อะไรก็ได้",
  },
  { id: "taste", question: "อยากได้รสชาติแบบไหน", options: ["แซ่บ", "เค็ม", "หวาน", "จืด", "อะไรก็ได้"] },
];
