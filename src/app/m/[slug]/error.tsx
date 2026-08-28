"use client";

import { Button } from "@/components/ui/button";

export default function PublicMenuError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center gap-3 text-center">
      <h2 className="text-lg font-semibold">تعذر تحميل المنيو</h2>
      <Button onClick={reset}>إعادة المحاولة</Button>
    </div>
  );
}
