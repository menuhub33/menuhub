"use client";

import Link from "next/link";
import { useState } from "react";
import { register } from "@/actions/auth/register";
import { PasswordInput } from "@/components/auth/password-input";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("تأكيد كلمة المرور غير مطابق");
      return;
    }
    setLoading(true);
    setError("");
    const result = await register({
      full_name: fullName,
      email,
      phone,
      password,
      restaurant_name: restaurantName,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    window.location.assign(
      result.data?.needsEmailVerification ? "/verify-email" : "/onboarding"
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField label="الاسم" htmlFor="full_name" required>
        <Input id="full_name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
      </FormField>
      <FormField label="البريد الإلكتروني" htmlFor="email" required>
        <Input
          id="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </FormField>
      <FormField label="رقم الهاتف" htmlFor="phone">
        <Input id="phone" dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </FormField>
      <FormField
        label="اسم المطعم"
        htmlFor="restaurant_name"
        hint="اختياري. الإدارة هي من تنشئ الموقع وتفعّله."
      >
        <Input
          id="restaurant_name"
          value={restaurantName}
          onChange={(event) => setRestaurantName(event.target.value)}
        />
      </FormField>
      <FormField label="كلمة المرور" htmlFor="password" required hint="8 أحرف على الأقل">
        <PasswordInput
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />
      </FormField>
      <FormField label="تأكيد كلمة المرور" htmlFor="confirm" required>
        <PasswordInput
          id="confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
        />
      </FormField>
      <Button type="submit" size="lg" loading={loading} className="w-full">
        إنشاء الحساب
      </Button>
      <p className="text-center text-sm text-zinc-500">
        لديك حساب؟{" "}
        <Link href="/login" className="font-medium text-teal-700 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
