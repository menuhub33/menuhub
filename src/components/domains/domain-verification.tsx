"use client";

import { useState } from "react";
import { formatDateTime } from "@/components/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon } from "@/components/ui/icons";
import type { CustomDomain } from "@/lib/types";

const SSL_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  provisioning: "جارٍ الإصدار",
  active: "نشط",
  issued: "مُصدَر",
  expired: "منتهي",
  error: "خطأ",
  failed: "فشل",
};

function sslLabel(value: string | null): string {
  if (!value) return "غير متوفر";
  return SSL_LABELS[value.toLowerCase()] ?? value;
}

export function DomainVerification({
  domain,
  verifying,
  onVerify,
}: {
  domain: CustomDomain;
  verifying?: boolean;
  onVerify?: (domain: CustomDomain) => void | Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const token = domain.verification_token;
  const needsVerify =
    domain.status === "PENDING" || domain.status === "VERIFYING" || domain.status === "FAILED";

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>التحقق من النطاق</CardTitle>
        <CardDescription>
          انسخ رمز التحقق وأضفه في سجلات DNS ثم اضغط تحقق بعد انتشار السجل.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-2xl bg-zinc-50 px-4 py-3">
          <p className="text-xs text-zinc-500">النطاق</p>
          <p className="mt-1 font-medium text-zinc-900" dir="ltr">
            {domain.domain}
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-zinc-800">رمز التحقق</p>
          {token ? (
            <div className="flex items-center gap-2">
              <p
                className="min-w-0 flex-1 truncate rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-800"
                dir="ltr"
              >
                {token}
              </p>
              <Button variant="outline" onClick={() => void copyToken()} aria-label="نسخ رمز التحقق">
                <CopyIcon className="size-4" />
                {copied ? "تم النسخ" : "نسخ"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">لم يُنشأ رمز تحقق بعد.</p>
          )}
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-100 px-3 py-2">
            <dt className="text-xs text-zinc-500">تاريخ التحقق</dt>
            <dd className="mt-1 font-medium text-zinc-900">
              {domain.verified_at ? formatDateTime(domain.verified_at) : "لم يُتحقق بعد"}
            </dd>
          </div>
          <div className="rounded-2xl border border-zinc-100 px-3 py-2">
            <dt className="text-xs text-zinc-500">حالة شهادة SSL</dt>
            <dd className="mt-1 font-medium text-zinc-900">{sslLabel(domain.ssl_status)}</dd>
          </div>
        </dl>
        {needsVerify && onVerify ? (
          <Button
            loading={verifying}
            disabled={!token}
            onClick={() => void onVerify(domain)}
          >
            تحقق من النطاق
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
