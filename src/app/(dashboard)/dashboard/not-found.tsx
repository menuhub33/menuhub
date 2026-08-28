import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
      <h2 className="text-lg font-semibold">الصفحة غير موجودة</h2>
      <Link href="/dashboard" className="text-sm text-teal-700 hover:underline">
        العودة للرئيسية
      </Link>
    </div>
  );
}
