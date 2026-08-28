import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="grid place-items-center gap-2 py-16 text-center">
      <h2 className="text-lg font-semibold">الصفحة غير موجودة</h2>
      <Link href="/admin" className="text-sm text-teal-700">
        العودة للإدارة
      </Link>
    </div>
  );
}
