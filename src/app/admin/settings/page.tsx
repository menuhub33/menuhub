import { getReservedSubdomain } from "@/actions/reserved-subdomains/getReservedSubdomain";
import { createReservedSubdomain } from "@/actions/reserved-subdomains/createReservedSubdomain";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { revalidatePath } from "next/cache";
import type { ReservedSubdomain } from "@/lib/types";

export default async function AdminSettingsPage() {
  const reserved = await getReservedSubdomain();
  const list = (
    Array.isArray(reserved.data) ? reserved.data : reserved.data ? [reserved.data] : []
  ) as ReservedSubdomain[];

  async function addSlug(formData: FormData) {
    "use server";
    const slug = String(formData.get("slug") ?? "");
    await createReservedSubdomain(slug);
    revalidatePath("/admin/settings");
  }

  return (
    <div className="grid gap-4">
      <PageHeader title="إعدادات المنصة" description="النطاقات المحجوزة وإعدادات النظام." />
      <Alert>
        لا تضع مفتاح service_role في المتصفح. المفتاح يستخدم فقط في إجراءات الخادم الإدارية.
      </Alert>
      <form action={addSlug} className="flex gap-2">
        <input
          name="slug"
          dir="ltr"
          className="h-11 flex-1 rounded-xl border border-zinc-200 px-3 text-sm"
          placeholder="admin"
        />
        <button className="h-11 rounded-xl bg-teal-700 px-4 text-sm font-medium text-white" type="submit">
          حجز نطاق فرعي
        </button>
      </form>
      <ul className="grid gap-2 sm:grid-cols-3">
        {list.map((item) => (
          <li key={item.id} className="rounded-xl bg-white px-3 py-2 text-sm" dir="ltr">
            {item.slug}
          </li>
        ))}
      </ul>
    </div>
  );
}
