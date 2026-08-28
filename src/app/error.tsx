"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-bold text-zinc-900">حدث خطأ غير متوقع</h1>
      <p className="max-w-sm text-sm text-zinc-500">حاول إعادة تحميل الصفحة. إذا استمر الخطأ تواصل مع الدعم.</p>
      <Button onClick={reset}>إعادة المحاولة</Button>
    </div>
  );
}
