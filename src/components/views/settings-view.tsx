"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/profiles/updateProfile";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs } from "@/components/ui/tabs";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { RestaurantSettingsForm } from "@/components/views/restaurant-settings-form";
import type { Profile, Restaurant } from "@/lib/types";
import Link from "next/link";

export function SettingsView({
  profile,
  restaurant,
  canManageRestaurant,
  canManageSubscription,
  initialTab,
}: {
  profile: Profile;
  restaurant: Restaurant;
  canManageRestaurant: boolean;
  canManageSubscription: boolean;
  initialTab?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState(() => {
    if (initialTab === "restaurant" && canManageRestaurant) return "restaurant";
    if (initialTab === "subscription" && canManageSubscription) return "subscription";
    if (initialTab === "security" || initialTab === "notifications") return initialTab;
    return "account";
  });

  useEffect(() => {
    if (initialTab === "restaurant" && canManageRestaurant) setTab("restaurant");
    else if (initialTab === "subscription" && canManageSubscription) setTab("subscription");
    else if (initialTab === "security" || initialTab === "notifications") setTab(initialTab);
    else if (initialTab === "account") setTab("account");
  }, [initialTab, canManageRestaurant, canManageSubscription]);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "account", label: "الحساب" },
    { id: "restaurant", label: "بيانات النشاط", disabled: !canManageRestaurant },
    { id: "security", label: "الأمان" },
    { id: "notifications", label: "الإشعارات" },
    { id: "subscription", label: "الاشتراك", disabled: !canManageSubscription },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الإعدادات"
        breadcrumbs={[{ label: "الرئيسية", href: "/dashboard" }, { label: "الإعدادات" }]}
      />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === "account" ? (
        <form
          className="grid max-w-lg gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            const result = await updateProfile({ full_name: fullName, phone });
            setLoading(false);
            if (result.error) toast({ title: result.error, variant: "error" });
            else {
              toast({ title: "تم حفظ الحساب", variant: "success" });
              router.refresh();
            }
          }}
        >
          <FormField label="الاسم" htmlFor="full_name">
            <Input id="full_name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </FormField>
          <FormField label="الهاتف" htmlFor="phone">
            <Input id="phone" dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </FormField>
          <Button type="submit" loading={loading}>حفظ</Button>
        </form>
      ) : null}
      {tab === "security" ? (
        <Alert title="الأمان">
          يمكنك إعادة تعيين كلمة المرور من{" "}
          <Link href="/forgot-password" className="underline">
            صفحة الاستعادة
          </Link>
          .
        </Alert>
      ) : null}
      {tab === "notifications" ? (
        <Alert>
          الإشعارات تظهر في الجرس أعلى اللوحة. سيتم إضافة تفضيلات أدق لاحقاً دون التأثير على التنبيهات الحالية.
        </Alert>
      ) : null}
      {tab === "restaurant" && canManageRestaurant ? (
        <RestaurantSettingsForm restaurant={restaurant} />
      ) : null}
      {tab === "subscription" && canManageSubscription ? (
        <Alert>
          إدارة الخطة والدفع من صفحة{" "}
          <Link href="/dashboard/subscription" className="underline">
            الاشتراك
          </Link>
          .
        </Alert>
      ) : null}
    </div>
  );
}
