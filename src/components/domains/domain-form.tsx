"use client";

import { useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function DomainForm({
  defaultDomain = "",
  loading,
  error,
  submitLabel = "إضافة النطاق",
  onSubmit,
}: {
  defaultDomain?: string;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
  onSubmit: (domain: string) => void | Promise<void>;
}) {
  const [domain, setDomain] = useState(defaultDomain);
  const [localError, setLocalError] = useState<string | null>(null);

  function normalize(value: string): string {
    return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const next = normalize(domain);
        if (!next) {
          setLocalError("أدخل اسم النطاق.");
          return;
        }
        if (!DOMAIN_PATTERN.test(next)) {
          setLocalError("صيغة النطاق غير صحيحة. مثال: menu.example.com");
          return;
        }
        setLocalError(null);
        void onSubmit(next);
      }}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      {localError ? <Alert variant="error">{localError}</Alert> : null}
      <FormField
        label="النطاق المخصص"
        htmlFor="custom-domain"
        required
        hint="بدون http:// أو مسار. يمكنك استخدام نطاق فرعي مثل menu.example.com"
      >
        <Input
          id="custom-domain"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          placeholder="menu.example.com"
          value={domain}
          disabled={loading}
          required
          onChange={(event) => setDomain(event.target.value)}
        />
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
