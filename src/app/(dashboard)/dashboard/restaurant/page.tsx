import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/authorization";

const LINKS = [
  { href: "/dashboard/restaurant/settings", title: "الإعدادات العامة", text: "الاسم، التوصيل، مساعد المنيو ورقم التواصل" },
  { href: "/dashboard/restaurant/hours", title: "ساعات العمل", text: "أيام الفتح والإغلاق" },
  { href: "/dashboard/restaurant/social", title: "روابط التواصل", text: "إنستغرام، فيسبوك، وغيرها" },
];

export default async function RestaurantPage() {
  await requirePermission("restaurant.update");
  return (
    <div className="grid gap-6">
      <PageHeader
        title="النشاط"
        description="عدّل بيانات النشاط وساعات العمل وروابط التواصل."
        breadcrumbs={[{ label: "الرئيسية", href: "/dashboard" }, { label: "النشاط" }]}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full hover:border-teal-200">
              <CardContent className="pt-5">
                <CardTitle>{link.title}</CardTitle>
                <p className="mt-2 text-sm text-zinc-500">{link.text}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
