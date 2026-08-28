import Link from "next/link";
import { requireRestaurantAccess } from "@/lib/auth/authorization";
import { publicMenuUrl } from "@/lib/config";
import { Button } from "@/components/ui/button";

export default async function OnboardingCompletedPage() {
  const tenant = await requireRestaurantAccess("/onboarding/completed");
  const url = publicMenuUrl(tenant.restaurant.slug);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl">🎉</p>
      <h1 className="mt-4 text-2xl font-bold">تم إنشاء منيو مطعمك</h1>
      <p className="mt-3 rounded-xl bg-white px-4 py-2 text-sm text-zinc-600" dir="ltr">
        {url}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={`/m/${tenant.restaurant.slug}`}>
          <Button>عرض المنيو</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">فتح لوحة التحكم</Button>
        </Link>
      </div>
    </div>
  );
}
