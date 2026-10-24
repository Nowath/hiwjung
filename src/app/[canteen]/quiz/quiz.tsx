"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Shuffle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { QUIZ } from "@/config/flow";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Quiz({ canteenId }: { canteenId: string }) {
  const router = useRouter();
  const saveAnswer = useStore((s) => s.setAnswer);
  // เริ่มว่างทุกครั้งที่เข้าหน้า — ไม่ดึงคำตอบรอบก่อนจาก store มาแสดง (store เก็บไว้ใช้กรองในอนาคตเท่านั้น)
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState(0);
  const q = QUIZ[step];
  const picked = answers[q.id] ?? [];

  function setAnswer(id: string, value: string[]) {
    setAnswers((a) => ({ ...a, [id]: value }));
    saveAnswer(id, value);
  }

  function next() {
    if (step < QUIZ.length - 1) setStep(step + 1);
    else router.push(`/${canteenId}/open`);
  }

  function choose(option: string) {
    if (!q.multi) {
      setAnswer(q.id, [option]);
      return next();
    }
    // เลือกหลายข้อ: ตัว exclusive ("อะไรก็ได้") ล้างตัวอื่น และเลือกตัวอื่นแล้วล้าง exclusive
    if (option === q.exclusive) return setAnswer(q.id, picked.includes(option) ? [] : [option]);
    const rest = picked.filter((p) => p !== q.exclusive);
    setAnswer(q.id, rest.includes(option) ? rest.filter((p) => p !== option) : [...rest, option]);
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* แถบขั้นแบบแยกช่อง บอกได้ทันทีว่าเหลืออีกกี่ข้อ */}
      <div className="flex gap-1.5 pt-2" role="progressbar" aria-valuemin={1} aria-valuemax={QUIZ.length} aria-valuenow={step + 1}>
        {QUIZ.map((item, i) => (
          <span
            key={item.id}
            className={cn("h-1.5 flex-1 rounded-full transition-colors duration-(--dur-med)", i <= step ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>

      {/* key=step ให้ทั้งก้อน remount แล้วเล่น rise ใหม่ทุกข้อ */}
      <section key={q.id} className="rise pt-8">
        <p className="text-base text-muted-foreground">
          ข้อ {step + 1} จาก {QUIZ.length}
          {q.multi && " · เลือกได้หลายข้อ"}
        </p>
        <h1 className="font-heading text-3xl font-bold">{q.question}?</h1>

        <div
          role={q.multi ? "group" : "radiogroup"}
          aria-label={q.question}
          className={cn("mt-6 grid gap-3", q.options.length > 4 && "grid-cols-2")}
        >
          {q.options.map((option) => {
            const selected = picked.includes(option);
            return (
              <button
                key={option}
                type="button"
                role={q.multi ? "checkbox" : "radio"}
                aria-checked={selected}
                onClick={() => choose(option)}
                className={cn(
                  "flex min-h-14 items-center justify-between gap-2 rounded-card border-2 bg-card px-4 text-left",
                  "font-heading text-xl font-bold",
                  "transition-colors duration-(--dur-fast) outline-none focus-visible:ring-[3px] focus-visible:ring-ring active:scale-[0.99]",
                  selected ? "border-primary bg-accent text-rose-900" : "border-transparent shadow-card hover:border-rose-300",
                )}
              >
                {option}
                {selected && <Check className="size-5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>

        {q.multi && (
          <Button className="mt-6 h-12 w-full text-lg" disabled={!picked.length} onClick={next}>
            {step < QUIZ.length - 1 ? "ถัดไป" : "ไปเปิดซอง"}
          </Button>
        )}
      </section>

      <div className="mt-auto grid gap-2 pt-10">
        <Link href={`/${canteenId}/open`} className={cn(buttonVariants({ variant: "outline" }), "h-12 w-full text-lg")}>
          <Shuffle data-icon="inline-start" />
          ข้ามไปเปิดซองเลย
        </Link>
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          className="mx-auto min-h-11 rounded-full px-3 text-base text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring disabled:invisible"
        >
          ข้อก่อนหน้า
        </button>
      </div>
    </div>
  );
}
