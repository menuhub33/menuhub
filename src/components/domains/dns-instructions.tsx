"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon } from "@/components/ui/icons";

function apexHost(domain: string): string {
  const parts = domain.split(".").filter(Boolean);
  if (parts.length <= 2) return domain;
  return parts.slice(-2).join(".");
}

function hostName(domain: string): string {
  const apex = apexHost(domain);
  if (domain === apex) return "@";
  return domain.slice(0, domain.length - apex.length - 1) || "@";
}

function CopyRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="truncate font-mono text-sm text-zinc-900" dir="ltr">
          {value}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => void copy()} aria-label={`نسخ ${label}`}>
        <CopyIcon className="size-4" />
        {copied ? "تم" : "نسخ"}
      </Button>
    </div>
  );
}

export function DnsInstructions({
  domain,
  verificationToken,
  cnameTarget,
  aRecord,
}: {
  domain: string;
  verificationToken?: string | null;
  cnameTarget?: string;
  aRecord?: string;
}) {
  const host = hostName(domain);
  const txtHost = `_menuhub.${host === "@" ? apexHost(domain) : domain}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>تعليمات DNS</CardTitle>
        <CardDescription>
          أضف السجلات من لوحة إدارة النطاق لدى مزوّدك. التعليمات عامة ولا تخص حساب مزوّد معيّن.
          قد يستغرق انتشار DNS حتى 48 ساعة.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 text-sm">
        <ol className="grid gap-4">
          {verificationToken ? (
            <li className="grid gap-2 rounded-2xl border border-zinc-200 p-4">
              <p className="font-semibold text-zinc-900">1. سجل TXT للتحقق</p>
              <p className="text-zinc-600">
                أنشئ سجل TXT يثبت ملكية{" "}
                <span className="font-mono" dir="ltr">
                  {domain}
                </span>
                . بعد الحفظ ارجع واضغط تحقق.
              </p>
              <CopyRow label="النوع" value="TXT" />
              <CopyRow label="الاسم / المضيف" value={txtHost} />
              <CopyRow label="القيمة" value={verificationToken} />
            </li>
          ) : (
            <li className="rounded-2xl border border-zinc-200 p-4 text-zinc-600">
              سيظهر سجل TXT هنا عندما يتوفر رمز التحقق للنطاق.
            </li>
          )}
          <li className="grid gap-2 rounded-2xl border border-zinc-200 p-4">
            <p className="font-semibold text-zinc-900">
              {verificationToken ? "2. " : "1. "}سجل CNAME لتوجيه الزيارات
            </p>
            <p className="text-zinc-600">
              إن كان النطاق فرعيًا (مثل menu.example.com) أضف CNAME يشير إلى هدف الاستضافة الذي يزوّدك به
              MenuHub.
            </p>
            <CopyRow label="النوع" value="CNAME" />
            <CopyRow label="الاسم / المضيف" value={host} />
            {cnameTarget ? (
              <CopyRow label="القيمة" value={cnameTarget} />
            ) : (
              <p className="text-zinc-600">
                القيمة: هدف CNAME الذي يظهر في إعدادات النطاق بعد إضافته في MenuHub.
              </p>
            )}
          </li>
          <li className="grid gap-2 rounded-2xl border border-zinc-200 p-4">
            <p className="font-semibold text-zinc-900">
              {verificationToken ? "3. " : "2. "}سجل A لنطاق الجذر (اختياري)
            </p>
            <p className="text-zinc-600">
              نطاق الجذر غالبًا لا يدعم CNAME. استخدم سجل A فقط إذا زوّدتك المنصة بعنوان IPv4، أو اترك
              التوجيه على النطاق الفرعي.
            </p>
            <CopyRow label="النوع" value="A" />
            <CopyRow label="الاسم / المضيف" value="@" />
            {aRecord ? (
              <CopyRow label="القيمة" value={aRecord} />
            ) : (
              <p className="text-zinc-600">
                القيمة: عنوان IPv4 الذي يظهر في إعدادات النطاق داخل MenuHub عند الحاجة.
              </p>
            )}
          </li>
        </ol>
        <p className="text-xs text-zinc-500">
          لا تنشر مفاتيح أو حسابات مزوّد DNS هنا. انسخ القيم أعلاه إلى لوحة النطاق الحقيقية لديك ثم انتظر
          الانتشار قبل إعادة التحقق.
        </p>
      </CardContent>
    </Card>
  );
}
