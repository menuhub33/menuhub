"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { login } from "@/actions/auth/login";
import { PasswordInput } from "@/components/auth/password-input";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUERY_ERRORS: Record<string, string> = {
  suspended: "تم تعليق الحساب. تواصل مع الدعم لإعادة التفعيل",
  callback: "تعذر إكمال التحقق. حاول تسجيل الدخول مرة أخرى",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(QUERY_ERRORS[searchParams.get("error") ?? ""] ?? "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await login({ email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const next = searchParams.get("next");
    window.location.assign(
      result.data?.platformRole === "ADMIN" || result.data?.platformRole === "SUPER_ADMIN"
        ? "/admin"
        : next?.startsWith("/")
          ? next
          : "/dashboard"
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
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
      <FormField label="كلمة المرور" htmlFor="password" required>
        <PasswordInput id="password" value={password} onChange={setPassword} />
      </FormField>
      <Button type="submit" size="lg" loading={loading} className="w-full">
        تسجيل الدخول
      </Button>
      <Link href="/forgot-password" className="text-center text-sm text-teal-700 hover:underline">
        نسيت كلمة المرور؟
      </Link>
      <p className="text-center text-sm text-zinc-500">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-medium text-teal-700 hover:underline">
          إنشاء حساب
        </Link>
      </p>
    </form>
  );
}
