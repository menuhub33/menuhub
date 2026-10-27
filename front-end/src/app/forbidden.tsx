import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-medium text-red-600">403</p>
      <h1 className="text-2xl font-bold text-zinc-900">ليس لديك صلاحية للوصول إلى هذه الصفحة</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        حسابك لا يملك الصلاحية المطلوبة. إن كنت تعتقد أن هذا خطأ فاطلب من مالك المطعم تحديث دورك.
      </p>
      <Link href="/dashboard" className="text-sm font-medium text-teal-700 hover:underline">
        العودة للوحة التحكم
      </Link>
    </div>
  );
}
