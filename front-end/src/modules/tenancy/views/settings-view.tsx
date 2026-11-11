"use client";

import { useState } from "react";
import { reloadPage } from "@/core/lib/reload";
import { changeEmail, changePassword } from "@/modules/auth/actions/auth";
import { updateProfile } from "@/modules/auth/actions/profile";
import { PasswordInput } from "@/modules/auth/components/password-input";
import { PageHeader } from "@/core/components/layout/page-header";
import { Tabs } from "@/core/ui/tabs";
import { FormField } from "@/core/components/forms/form-field";
import { Input } from "@/core/ui/input";
import { Button } from "@/core/ui/button";
import { Alert } from "@/core/ui/alert";
import { useToast } from "@/core/ui/toast";
import { RestaurantSettingsForm } from "@/modules/tenancy/views/restaurant-settings-form";
import type { Profile } from "@/modules/auth/types";
import type { Restaurant } from "@/modules/tenancy/types";

export function SettingsView({
  profile,
  restaurant,
  canManageRestaurant,
  initialTab,
}: {
  profile: Profile;
  restaurant: Restaurant;
  canManageRestaurant: boolean;
  initialTab?: string;
}) {
  const { toast } = useToast();
  const tabFromUrl = () => {
    if (initialTab === "restaurant" && canManageRestaurant) return "restaurant";
    if (initialTab === "security" || initialTab === "notifications") return initialTab;
    if (initialTab === "account") return "account";
    return null;
  };

  const [tab, setTab] = useState(() => tabFromUrl() ?? "account");

  const [lastInitialTab, setLastInitialTab] = useState(initialTab);
  if (initialTab !== lastInitialTab) {
    setLastInitialTab(initialTab);
    const next = tabFromUrl();
    if (next) setTab(next);
  }
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(profile.email);
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [lastProfileEmail, setLastProfileEmail] = useState(profile.email);
  if (profile.email !== lastProfileEmail) {
    setLastProfileEmail(profile.email);
    setEmail(profile.email);
  }

  const tabs = [
    { id: "account", label: "الحساب" },
    { id: "restaurant", label: "بيانات النشاط", disabled: !canManageRestaurant },
    { id: "security", label: "الأمان" },
    { id: "notifications", label: "الإشعارات" },
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
              reloadPage();
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
        <div className="grid max-w-lg gap-8">
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setEmailLoading(true);
              const result = await changeEmail({ email, current_password: emailPassword });
              setEmailLoading(false);
              if (result.error) {
                toast({ title: result.error, variant: "error" });
                return;
              }
              setEmailPassword("");
              toast({
                title: result.data?.email_verified_at
                  ? "تم تحديث البريد الإلكتروني"
                  : "تم تحديث البريد. أكّد الرابط الذي وصلك",
                variant: "success",
              });
              reloadPage();
            }}
          >
            <div>
              <h2 className="text-base font-semibold text-zinc-900">البريد الإلكتروني</h2>
              <p className="mt-1 text-sm text-zinc-500">أدخل كلمة المرور الحالية لتأكيد تغيير البريد.</p>
            </div>
            <FormField label="البريد الإلكتروني" htmlFor="security-email" required>
              <Input
                id="security-email"
                type="email"
                dir="ltr"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </FormField>
            <FormField label="كلمة المرور الحالية" htmlFor="security-email-password" required>
              <PasswordInput
                id="security-email-password"
                autoComplete="current-password"
                value={emailPassword}
                onChange={setEmailPassword}
              />
            </FormField>
            <Button type="submit" loading={emailLoading}>حفظ البريد</Button>
          </form>

          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (nextPassword !== confirmPassword) {
                toast({ title: "تأكيد كلمة المرور غير مطابق", variant: "error" });
                return;
              }
              setPasswordLoading(true);
              const result = await changePassword({
                current_password: currentPassword,
                password: nextPassword,
              });
              setPasswordLoading(false);
              if (result.error) {
                toast({ title: result.error, variant: "error" });
                return;
              }
              setCurrentPassword("");
              setNextPassword("");
              setConfirmPassword("");
              toast({ title: "تم تحديث كلمة المرور", variant: "success" });
            }}
          >
            <h2 className="text-base font-semibold text-zinc-900">كلمة المرور</h2>
            <FormField label="كلمة المرور الحالية" htmlFor="current-password" required>
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
            </FormField>
            <FormField label="كلمة المرور الجديدة" htmlFor="new-password" required hint="8 أحرف على الأقل">
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={nextPassword}
                onChange={setNextPassword}
              />
            </FormField>
            <FormField label="تأكيد كلمة المرور" htmlFor="confirm-password" required>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </FormField>
            <Button type="submit" loading={passwordLoading}>حفظ كلمة المرور</Button>
          </form>
        </div>
      ) : null}
      {tab === "notifications" ? (
        <Alert>
          الإشعارات تظهر في الجرس أعلى اللوحة. سيتم إضافة تفضيلات أدق لاحقاً دون التأثير على التنبيهات الحالية.
        </Alert>
      ) : null}
      {tab === "restaurant" && canManageRestaurant ? (
        <RestaurantSettingsForm restaurant={restaurant} />
      ) : null}
    </div>
  );
}
