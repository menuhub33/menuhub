"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { resetPassword } from "@/modules/auth/actions/auth";
import { PasswordInput } from "@/modules/auth/components/password-input";
import { FormField } from "@/core/components/forms/form-field";
import { Alert } from "@/core/ui/alert";
import { Button } from "@/core/ui/button";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The e-mail sent by the back-end links to /reset-password?token=…&email=…
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(
    token && email ? "" : "رابط إعادة التعيين غير صالح. اطلب رابطاً جديداً"
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("تأكيد كلمة المرور غير مطابق");
      return;
    }
    setLoading(true);
    setError("");
    const result = await resetPassword({ token, email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/login");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField label="كلمة المرور الجديدة" htmlFor="password" required>
        <PasswordInput id="password" autoComplete="new-password" value={password} onChange={setPassword} />
      </FormField>
      <FormField label="تأكيد كلمة المرور" htmlFor="confirm" required>
        <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={setConfirm} />
      </FormField>
      <Button type="submit" size="lg" loading={loading} disabled={!token || !email} className="w-full">
        حفظ كلمة المرور
      </Button>
    </form>
  );
}
