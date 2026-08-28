"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetPassword } from "@/actions/auth/resetPassword";
import { PasswordInput } from "@/components/auth/password-input";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    const result = await resetPassword(password);
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
      <Button type="submit" size="lg" loading={loading} className="w-full">
        حفظ كلمة المرور
      </Button>
    </form>
  );
}
