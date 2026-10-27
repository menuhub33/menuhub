"use client";

import Link from "next/link";
import { useState } from "react";
import { forgotPassword } from "@/modules/auth/actions/auth";
import { FormField } from "@/core/components/forms/form-field";
import { Alert } from "@/core/ui/alert";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await forgotPassword(email);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Alert variant="success" title="تم إرسال الرابط">
        إن كان البريد مسجلاً فستصلك رسالة لإعادة تعيين كلمة المرور.
      </Alert>
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </FormField>
      <Button type="submit" size="lg" loading={loading} className="w-full">
        إرسال رابط الاستعادة
      </Button>
      <Link href="/login" className="text-center text-sm text-teal-700 hover:underline">
        العودة لتسجيل الدخول
      </Link>
    </form>
  );
}
