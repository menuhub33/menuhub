import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-medium text-teal-700">404</p>
      <h1 className="text-2xl font-bold text-zinc-900">الصفحة غير موجودة</h1>
      <p className="max-w-sm text-sm text-zinc-500">تحقق من الرابط أو عد إلى الصفحة الرئيسية.</p>
      <Link href="/" className="text-sm font-medium text-teal-700 hover:underline">
        العودة للرئيسية
      </Link>
    </div>
  );
}
