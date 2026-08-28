"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid place-items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold">تعذر تحميل لوحة الإدارة</h2>
      <Button onClick={reset}>إعادة المحاولة</Button>
    </div>
  );
}
