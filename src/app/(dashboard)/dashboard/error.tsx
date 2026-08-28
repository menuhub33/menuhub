"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold">تعذر تحميل لوحة التحكم</h2>
      <Button onClick={reset}>إعادة المحاولة</Button>
    </div>
  );
}
