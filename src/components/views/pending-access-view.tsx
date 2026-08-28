import Link from "next/link";
import { logout } from "@/actions/auth/logout";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import type { Restaurant } from "@/lib/types";

export function PendingAccessView({
  restaurant,
}: {
  restaurant: Restaurant | null;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-teal-700">MenuHub</p>
      <h1 className="mt-3 text-2xl font-bold text-zinc-900">
        {restaurant ? "المطعم بانتظار التفعيل" : "لا يمكن إنشاء الموقع من هنا"}
      </h1>
      <p className="mt-3 text-sm leading-7 text-zinc-600">
        {restaurant
          ? `تم إنشاء مطعم ${restaurant.name}، لكن لوحة التحكم والمنيو العامة لا تعملان حتى يفعّله مدير المنصة.`
          : "إنشاء المواقع وتفعيل المطاعم يتم فقط من لوحة تحكم الإدارة. بعد تسجيل حسابك، ينشئ المدير المطعم ويربطه بحسابك ثم يفعّله."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button variant="outline">العودة للرئيسية</Button>
        </Link>
        <form
          action={async () => {
            "use server";
            await logout();
            redirect("/login");
          }}
        >
          <Button type="submit" variant="ghost">
            تسجيل الخروج
          </Button>
        </form>
      </div>
    </div>
  );
}
