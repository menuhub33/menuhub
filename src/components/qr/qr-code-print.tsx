"use client";

import { cn } from "@/components/lib/cn";
import { QrCodePreview } from "@/components/qr/qr-code-preview";
import { Button } from "@/components/ui/button";
import { PrinterIcon } from "@/components/ui/icons";
import type { QrCode } from "@/lib/types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function printSheetHtml(qrUrl: string, name: string, restaurantName?: string): string {
  const title = escapeHtml(restaurantName?.trim() || name);
  const subtitle = escapeHtml(name);
  const src = escapeHtml(qrUrl);
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Tahoma, "Segoe UI", sans-serif;
      color: #18181b;
      background: #fff;
    }
    .sheet { text-align: center; padding: 32px; max-width: 420px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .name { color: #52525b; margin: 0 0 24px; font-size: 14px; }
    img { width: 280px; height: 280px; object-fit: contain; }
    .hint { margin: 24px 0 0; font-size: 14px; color: #3f3f46; }
  </style>
</head>
<body>
  <div class="sheet">
    <h1>${title}</h1>
    <p class="name">${subtitle}</p>
    <img src="${src}" alt="${subtitle}" />
    <p class="hint">امسح الرمز لعرض المنيو</p>
  </div>
</body>
</html>`;
}

export function printQrSheet(qrUrl: string, name: string, restaurantName?: string) {
  const printWindow = window.open("", "_blank", "noopener,width=480,height=640");
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.open();
  printWindow.document.write(printSheetHtml(qrUrl, name, restaurantName));
  printWindow.document.close();

  const img = printWindow.document.querySelector("img");
  const runPrint = () => {
    printWindow.focus();
    printWindow.print();
  };
  if (img && !img.complete) {
    img.addEventListener("load", runPrint, { once: true });
    img.addEventListener("error", runPrint, { once: true });
  } else {
    runPrint();
  }
}

export function QrCodePrint({
  qr,
  restaurantName,
  className,
}: {
  qr: Pick<QrCode, "name" | "qr_url">;
  restaurantName?: string;
  className?: string;
}) {
  function handlePrint() {
    printQrSheet(qr.qr_url, qr.name, restaurantName);
  }

  return (
    <div className={cn("grid justify-items-center gap-4", className)}>
      <div className="qr-print-sheet w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        {restaurantName ? (
          <p className="text-lg font-bold text-zinc-900">{restaurantName}</p>
        ) : null}
        <p className="mt-1 text-sm text-zinc-500">{qr.name}</p>
        <div className="mx-auto mt-4 max-w-[240px]">
          <QrCodePreview qrUrl={qr.qr_url} name={qr.name} />
        </div>
        <p className="mt-4 text-sm text-zinc-600">امسح الرمز لعرض المنيو</p>
      </div>
      <Button variant="outline" onClick={handlePrint} className="qr-print-actions">
        <PrinterIcon className="size-4" />
        طباعة
      </Button>
    </div>
  );
}
